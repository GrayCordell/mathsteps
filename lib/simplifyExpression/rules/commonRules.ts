/* eslint-disable antfu/consistent-list-newline */
import {
  ADD_FRACTIONS,
  COMMON_DENOMINATOR,
  DISTRIBUTE_NEGATIVE_ONE,
  DIVISION_BY_NEGATIVE_ONE,
  DIVISION_BY_ONE,
  KEMU_REMOVE_DOUBLE_FRACTION,
  MULTIPLY_BY_ZERO,
  MULTIPLY_FRACTIONS,
  PERCENTS_ADD,
  PERCENTS_CONVERT_TO_FRACTION,
  PERCENTS_SUB,
  REDUCE_EXPONENT_BY_ZERO,
  REDUCE_ZERO_NUMERATOR,
  REMOVE_ADDING_ZERO,
  REMOVE_EXPONENT_BASE_ONE,
  REMOVE_EXPONENT_BASE_ZERO,
  REMOVE_EXPONENT_BY_ONE,
  REMOVE_MULTIPLYING_BY_NEGATIVE_ONE,
  REMOVE_MULTIPLYING_BY_ONE,
  RESOLVE_DOUBLE_MINUS,
  SIMPLIFY_ARITHMETIC__ADD,
  SIMPLIFY_ARITHMETIC__MULTIPLY,
  SIMPLIFY_ARITHMETIC__POWER,
  SIMPLIFY_ARITHMETIC__SUBTRACT,
  SIMPLIFY_SIGNS,
} from '~/ChangeTypes'
import type ChangeTypes from '~/ChangeTypes'

import Node from '../../node/index.js'
import { math } from '~/config.js'
import { createFunctionForEveryRule } from '~/util/ruleHelper.js'
import { applyRules } from '../_common.js'

const makeConstant = (value: any) => Node.Creator.constant(value)
const makeOperator = (operator: any, operands: any) => Node.Creator.operator(operator, operands)
const makePercent = (value: any) => Node.Creator.percent(makeConstant(value))

const createConstantOp = (operation: any) => (node: any, vars: any) =>
  makeConstant(operation(vars.c1.value, vars.c2.value))
// eslint-disable-next-line ts/no-use-before-define
export const findRule = (l: string, id: keyof typeof ChangeTypes): any => commonPoolOfRules.find(rule => rule.id === id && rule.l === l)

export const commonPoolOfRules = [
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
    l: 'c1 + c2', id: SIMPLIFY_ARITHMETIC__ADD, replaceFct: createConstantOp(math.add),
    mistakes: [
      // Also could be:
      // { l: 'c1 - c2', id: SIMPLIFY_ARITHMETIC__SUBTRACT, replaceFct: createConstantOp(math.subtract) },
      //  But getFromRule will just grab it from the rulePool
      { getFromRule: () => findRule('c1 - c2', SIMPLIFY_ARITHMETIC__SUBTRACT) },
      { getFromRule: () => findRule('c1 * c2', SIMPLIFY_ARITHMETIC__MULTIPLY) },
    ],
  },

  { l: 'c1 - c2', id: SIMPLIFY_ARITHMETIC__SUBTRACT, replaceFct: createConstantOp(math.subtract) },
  { l: 'c1 * c2', id: SIMPLIFY_ARITHMETIC__MULTIPLY, replaceFct: createConstantOp(math.multiply) },
  { l: 'c1 ^ c2', id: SIMPLIFY_ARITHMETIC__POWER, replaceFct: createConstantOp(math.pow) },

  // Percents
  { l: 'percent(c1) + percent(c2)', id: PERCENTS_ADD, replaceFct: (node: any, vars: any) =>
    makePercent(math.add(vars.c1.value, vars.c2.value)) },
  { l: 'percent(c1) - percent(c2)', id: PERCENTS_SUB, replaceFct: (node: any, vars: any) =>
    makePercent(math.subtract(vars.c1.value, vars.c2.value)) },
  { l: 'percent(n)', r: 'n/100', id: PERCENTS_CONVERT_TO_FRACTION },

  // Fractions
  { l: 'n1/v2 * n3', r: '(n1 * n3) / v2', id: MULTIPLY_FRACTIONS },
  { l: 'v1/n2 * n3', r: '(v1 * n3) / n2', id: MULTIPLY_FRACTIONS },
  { l: 'n1/n2 * n3/n4', r: '(n1 n3) / (n2 n4)', id: MULTIPLY_FRACTIONS },
  { l: 'c1/c2 * c3', r: '(c1 c3) / c2', id: MULTIPLY_FRACTIONS },
  { l: 'n1/n2/n3', r: 'n1/(n3*n2)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: '(n1/n2)/n3', r: 'n1/(n2*n3)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: 'n1/(n2/n3)', r: 'n1*(n3/n2)', id: KEMU_REMOVE_DOUBLE_FRACTION },
  { l: 'n1/(n2/n3*n4)', r: '(n1 n3)/(n2 n4)', id: KEMU_REMOVE_DOUBLE_FRACTION },

  // Simplify signs
  { l: '-n1 / (-n2)', r: 'n1/n2', id: SIMPLIFY_SIGNS },
  { l: '-c1 / (-c2)', r: 'c1/c2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / (-n2)', r: '-n1/n2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / (-c2)', r: '-n1/c2', id: SIMPLIFY_SIGNS },
  { l: 'n1 / ((-n2) * n3)', r: '-n1/(n2 n3)', id: SIMPLIFY_SIGNS },
  { l: 'n1 + n2 * (-n3)', r: 'n1 - (n2 n3)', id: SIMPLIFY_SIGNS },
  { l: '-n1 * (-n2)', r: 'n1 n2', id: SIMPLIFY_SIGNS },
  { l: '-c1 * (-n2)', r: 'c1 n2', id: SIMPLIFY_SIGNS },
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
        : makeOperator('*', [num1, makeConstant(math.divide(lcm.value, denom1.value))])

      const newNum2 = math.equal(denom2.value, lcm.value)
        ? num2
        : makeOperator('*', [num2, makeConstant(math.divide(lcm.value, denom2.value))])

      return makeOperator('/', [makeOperator('+', [newNum1, newNum2]), lcm])
    },
  },
] as const

export const commonRules = createFunctionForEveryRule(commonPoolOfRules)
export const commonRulesPooledTogether = (node: any) => applyRules(node, commonPoolOfRules)
export default {
  commonRules,
  commonRulesPooledTogether,
}
