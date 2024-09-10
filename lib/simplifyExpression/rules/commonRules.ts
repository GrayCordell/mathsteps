/* eslint-disable antfu/consistent-list-newline */
import Node from '../../node/index.js'
import math from '~/config'
import { createFunctionForEveryRule } from '~/newServices/ruleHelper'
import { applyRules } from '../kemuSimplifyCommonServices.js'
import { cleanString } from '~/util/stringUtils'
import { commonRuleMistakes } from '~/simplifyExpression/mistakes/commonRulesMistakes'
import ChangeTypes from '~/types/ChangeTypes'

const { ADD_FRACTIONS, COMMON_DENOMINATOR, DISTRIBUTE_NEGATIVE_ONE, DIVISION_BY_NEGATIVE_ONE, DIVISION_BY_ONE, KEMU_REMOVE_DOUBLE_FRACTION, MULTIPLY_BY_ZERO, MULTIPLY_FRACTIONS, PERCENTS_ADD, PERCENTS_CONVERT_TO_FRACTION, PERCENTS_SUB, REDUCE_EXPONENT_BY_ZERO, REDUCE_ZERO_NUMERATOR, REMOVE_ADDING_ZERO, REMOVE_EXPONENT_BASE_ONE, REMOVE_EXPONENT_BASE_ZERO, REMOVE_EXPONENT_BY_ONE, REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, REMOVE_MULTIPLYING_BY_ONE, RESOLVE_DOUBLE_MINUS, SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__MULTIPLY, SIMPLIFY_ARITHMETIC__POWER, SIMPLIFY_ARITHMETIC__SUBTRACT, SIMPLIFY_SIGNS } = ChangeTypes

// Utilities for making nodes faster and more readable
const makeConstant = (value: any) => Node.Creator.constant(value)
const makeOp = (operator: any, operands: any) => Node.Creator.operator(operator, operands)
const makePercent = (value: any) => Node.Creator.percent(makeConstant(value))

type AnyFunction = (...args: any[]) => any
const makeConstantFromOp = (operation: AnyFunction) => (node: any, vars: any) =>
  makeConstant(operation(vars.c1.value, vars.c2.value))

/**
 * A list of rules are applied to an expression, repeating over the list until
 * no further changes are made.
 * It's possible to pass a custom set of rules to the function as second
 * argument. A rule can be specified as an object, string, or function:
 *
 *     const rules = [
 *       { l: 'n1*n3 + n2*n3', r: '(n1+n2)*n3' },
 *       'n1*n3 + n2*n3 -> (n1+n2)*n3',
 *       function (node) {
 *         // ... return a new node or return the node unchanged
 *         return node
 *       }
 *     ]
 *
 * String and object rules consist of a left and right pattern. The left is
 * used to match against the expression and the right determines what matches
 * are replaced with. The main difference between a pattern and a normal
 * expression is that variables starting with the following characters are
 * interpreted as wildcards:
 *
 * - 'n' - matches any Node
 * - 'c' - matches any ConstantNode
 * - 'v' - matches any Node that is not a ConstantNode
 *
 *
 *  A new optional 'mistake' property has been added to the rule object.
 *  This property is an array of rules that are mistake rules for the main rule.
 *  They will only be checked on matches of the main rule. This is to help find common mistakes while matching the main rule.
 *  Mistakes when specified as strings will find the rule from the rule pool. Ex. 'n1 + n2' -> { l: 'n1 + n2', id: 'SIMPLIFY_ARITHMETIC__ADD', replaceFct: makeConstantFromOp(math.add) }
 *  Ids can be specified as well. Ex. 'SIMPLIFY_ARITHMETIC__ADD' -> { l: 'n1 + n2', id: 'SIMPLIFY_ARITHMETIC__ADD', replaceFct: makeConstantFromOp(math.add) }
 *  [ 'n1 + n2', 'SIMPLIFY_ARITHMETIC__ADD' ] -> { l: 'n1 + n2', id: 'SIMPLIFY_ARITHMETIC__ADD', replaceFct: makeConstantFromOp(math.add) }
 *  If there is not a mistake rule that is also another rule, then you need to create a new one. l is not required for mistake rules.
 *  { id: 'ADDED_1_TOO_MANY', replaceFct: (node, vars) => makeConstant(math.add(vars.c1.value + 1, vars.c2.value)) }
 *
 */

const _commonPoolOfRules = [
  // Power
  { l: 'n^0', r: '1', id: REDUCE_EXPONENT_BY_ZERO },
  { l: 'n^1', r: 'n', id: REMOVE_EXPONENT_BY_ONE },
  { l: '0^n', r: '0', id: REMOVE_EXPONENT_BASE_ZERO },
  { l: '1^n', r: '1', id: REMOVE_EXPONENT_BASE_ONE },

  // Multiply
  { l: '0*n', r: '0', id: MULTIPLY_BY_ZERO },
  { l: 'n*0', r: '0', id: MULTIPLY_BY_ZERO },
  { l: '1*n', r: 'n', id: REMOVE_MULTIPLYING_BY_ONE },
  { l: 'n*1', r: 'n', id: REMOVE_MULTIPLYING_BY_ONE },
  { l: '-1*n', r: '-n', id: REMOVE_MULTIPLYING_BY_NEGATIVE_ONE },

  // Division
  { l: '0/n', r: '0', id: REDUCE_ZERO_NUMERATOR },
  { l: 'n/1', r: 'n', id: DIVISION_BY_ONE },
  { l: 'n/-1', r: '-n', id: DIVISION_BY_NEGATIVE_ONE },

  // Addition
  { l: 'n+0', r: 'n', id: REMOVE_ADDING_ZERO },
  { l: 'n-0', r: 'n', id: REMOVE_ADDING_ZERO },

  // Distribute minus one
  { l: '-(n1/n2)', r: '(-n1)/n2', id: DISTRIBUTE_NEGATIVE_ONE },

  // Double minus
  { l: '-(-c)', r: 'c', id: RESOLVE_DOUBLE_MINUS },
  { l: '-(-c v)', r: 'c v', id: RESOLVE_DOUBLE_MINUS },
  { l: '-(-n)', r: 'n', id: RESOLVE_DOUBLE_MINUS },
  { l: 'n1 - (-n2)', r: 'n1 + n2', id: RESOLVE_DOUBLE_MINUS },
  { l: 'n1 - (-c1)', r: 'n1 + c1', id: RESOLVE_DOUBLE_MINUS },

  // Constant arithmetic
  {
    l: 'c1 + c2', id: SIMPLIFY_ARITHMETIC__ADD, replaceFct: makeConstantFromOp(math.add),
  },
  {
    l: 'c1 - c2', id: SIMPLIFY_ARITHMETIC__SUBTRACT, replaceFct: makeConstantFromOp(math.subtract),
  },
  {
    l: 'c1 * c2', id: SIMPLIFY_ARITHMETIC__MULTIPLY, replaceFct: makeConstantFromOp(math.multiply),
  },
  {
    l: 'c1 ^ c2',
    id: SIMPLIFY_ARITHMETIC__POWER,
    replaceFct: makeConstantFromOp(math.pow),
  },

  // Percents
  { l: 'percent(c1) + percent(c2)', id: PERCENTS_ADD, replaceFct: (node: any, vars: any) =>
    makePercent(math.add(vars.c1.value, vars.c2.value)) },
  { l: 'percent(c1) - percent(c2)', id: PERCENTS_SUB, replaceFct: (node: any, vars: any) =>
    makePercent(math.subtract(vars.c1.value, vars.c2.value)) },
  { l: 'percent(n)', r: 'n/100', id: PERCENTS_CONVERT_TO_FRACTION },

  // Fractions
  { l: 'n1/v2 * n3', r: '(n1 * n3) / v2', id: MULTIPLY_FRACTIONS },
  { l: 'v1/n2 * n3', r: '(v1 * n3) / n2', id: MULTIPLY_FRACTIONS },
  { l: 'n1/n2 * n3/n4', r: '(n1 * n3) / (n2 * n4)', id: MULTIPLY_FRACTIONS },
  { l: 'c1/c2 * c3', r: '(c1 * c3) / c2', id: MULTIPLY_FRACTIONS },
  { l: 'n1/n2/n3', r: 'n1/(n3*n2)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: '(n1/n2)/n3', r: 'n1/(n2*n3)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: 'n1/(n2/n3)', r: 'n1*(n3/n2)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: 'n1/(n2/n3*n4)', r: '(n1 * n3)/(n2 * n4)', id: KEMU_REMOVE_DOUBLE_FRACTION },

  // Simplify signs
  { l: '-n1 / (-n2)', r: 'n1/n2', id: SIMPLIFY_SIGNS },
  { l: '-c1 / (-c2)', r: 'c1/c2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / (-n2)', r: '-n1/n2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / (-c2)', r: '-n1/c2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / ((-n2) * n3)', r: '-n1/(n2 * n3)', id: SIMPLIFY_SIGNS },
  { l: 'n1 + n2 * (-n3)', r: 'n1 - (n2 * n3)', id: SIMPLIFY_SIGNS },
  { l: '-n1 * (-n2)', r: 'n1 * n2', id: SIMPLIFY_SIGNS },
  { l: '-c1 * (-n2)', r: 'c1 * n2', id: SIMPLIFY_SIGNS },
  { l: '-(c1/c2*n)', r: '-c1/c2*n', id: SIMPLIFY_SIGNS },

  // Add fractions
  { l: 'c1 + c3/c2', r: '(c1*c2+c3) / c2', id: ADD_FRACTIONS },
  { l: 'c1/c2 + c3/c2', r: '(c1+c3) / c2', id: ADD_FRACTIONS },

  // Common denominator
  {
    l: 'c1/c2 + c3/c4',
    id: COMMON_DENOMINATOR,
    replaceFct: (node: any, vars: any) => {
      const { c1: num1, c2: denom1, c3: num2, c4: denom2 } = vars
      const lcm = makeConstant(math.lcm(denom1.value, denom2.value))

      const newNum1 = math.equal(denom1.value, lcm.value)
        ? num1
        : makeOp('*', [num1, makeConstant(math.divide(lcm.value, denom1.value))])

      const newNum2 = math.equal(denom2.value, lcm.value)
        ? num2
        : makeOp('*', [num2, makeConstant(math.divide(lcm.value, denom2.value))])

      return makeOp('/', [makeOp('+', [newNum1, newNum2]), lcm])
    },
  },

  // Pemdas mistakes - This does not work correctly in all cases right now. It is disabled. But this is the current format for making mistakes with custom L values
  // { // Added instead of multiplied
  //  mistakeL: 'c1 + c2 * c3',
  //  mistakes: [{
  //    id: 'PEMDAS__ADD_INSTEAD_OF_MULTIPLY',
  //    replaceFct: (node: any, vars: any) => {
  //      const added = math.add(vars.c1.value, vars.c2.value)
  //      const multiplied = makeOp('*', [makeConstant(added), vars.c3])
  //      return multiplied
  //    },
  //  }],
  // },
]
// Add mistakes found in commonRulesMistakes.ts to the rules
// Also if mistakeL is specified, then add mistakeL to the mistakes
_commonPoolOfRules.forEach((rule: any) => {
  // If mistakeL is specified, then add mistakeL to the mistakes
  if (rule.mistakeL) {
    rule.mistakes = rule.mistakes.map((mistake: any) => {
      mistake.l = rule.mistakeL
      if (rule.id && !mistake.id)
        mistake.id = rule.id
      return mistake
    })
    if (!rule.id)
      rule.id = rule.mistakes[0].id
  }

  // Add CommonRuleMistakes to the rules using their placeIn property
  const mistakesForRule: any[] = commonRuleMistakes.filter((mistake: any) => {
    const idAndL = cleanString(mistake.placeIn).split('|') // id | l1 .split('|')
    return cleanString(rule.id) === idAndL[0] && cleanString(rule.l) === idAndL[1]
  })

  for (const mistake of mistakesForRule) {
    if (!rule.mistakes)
      rule.mistakes = []

    mistake.l = rule.l // l is used for matching. so lets just add it onto the mistake
    rule.mistakes.push(mistake)
  }
})

export const commonPoolOfRules = _commonPoolOfRules
export const commonRules = createFunctionForEveryRule(commonPoolOfRules)
export const commonRulesPooledTogether = (node: any) => applyRules(node, commonPoolOfRules)
export default {
  commonRules,
  commonRulesPooledTogether,
}
