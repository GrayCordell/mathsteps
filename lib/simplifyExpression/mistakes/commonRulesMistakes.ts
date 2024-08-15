/* eslint-disable unused-imports/no-unused-vars */
import Node from '~/node/index.js'
import { math } from '~/config.js'
import { SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__MULTIPLY, SIMPLIFY_ARITHMETIC__SUBTRACT } from '~/types/ChangeTypes'

// Utilities for making nodes faster and more readable
const makeConstant = (value: any) => Node.Creator.constant(value)

function getOrMakeANodeValue(a: any, b: any) {
  let _a = typeof a === 'number' ? makeConstant(a) : a
  let _b = typeof b === 'number' ? makeConstant(b) : b
  _a = _a.value ? _a.value : _a
  _b = _b.value ? _b.value : _b
  return { _a, _b }
}

const subtract = (a: any, b: any) => {
  const { _a, _b } = getOrMakeANodeValue(a, b)
  return math.subtract(_a, _b)
}
const add = (a: any, b: any) => {
  const { _a, _b } = getOrMakeANodeValue(a, b)
  return math.add(_a, _b)
}

const multiply = (a: any, b: any) => {
  const { _a, _b } = getOrMakeANodeValue(a, b)
  return math.multiply(_a, _b)
}
const divide = (a: any, b: any) => {
  const { _a, _b } = getOrMakeANodeValue(a, b)
  return math.divide(_a, _b)
}
const pow = (a: any, b: any) => {
  const { _a, _b } = getOrMakeANodeValue(a, b)
  return math.pow(_a, _b)
}

const toNum = (node: any) => node.value ? node.value.toNumber() : node.toNumber()

const makeOperator = (operator: any, operands: any) => Node.Creator.operator(operator, operands)
const makePercent = (value: any) => Node.Creator.percent(makeConstant(value))

// Centralized configuration for operation IDs. Used to map mistakes to their respective operations. (id | l1)
const OperationIds = {
  ADD: `${SIMPLIFY_ARITHMETIC__ADD} | c1 + c2`,
  SUBTRACT: `${SIMPLIFY_ARITHMETIC__SUBTRACT} | c1 - c2`,
  MULTIPLY: `${SIMPLIFY_ARITHMETIC__MULTIPLY} | c1 * c2`,
  // DIVIDE: SIMPLIFY_ARITHMETIC__DIVIDE,
} as const

const createMistake = (placeIn: string) => (id: any, replaceFct: (node: any, vars: any) => unknown) => ({ id, placeIn, replaceFct })
// Addition Mistakes
const createAdditionMistake = createMistake(OperationIds.ADD)
const additionMistakes = [
  createAdditionMistake('SUBTRACTED_INSTEAD_OF_ADDED', (node, { c1, c2 }) => makeConstant(subtract(c1, c2))),
  createAdditionMistake('MULTIPLIED_INSTEAD_OF_ADDED', (node, { c1, c2 }) => makeConstant(multiply(c1, c2))),
  createAdditionMistake('ADDED_WITHOUT_CARRYING', (node, { c1, c2 }) => makeConstant(add(toNum(c1) % 10, toNum(c2) % 10))),
  // createAdditionMistake('FORGOT_CARRY_IN_ADDITION', (node, vars) => makeConstant(add(vars.c1.value % 10, vars.c2.value % 10))),
  // createAdditionMistake('ADDED_ONE_TOO_MANY', (node, vars) => makeConstant(add(vars.c1.value + 1, vars.c2.value))),
  // createAdditionMistake('ADDED_ONE_TOO_FEW', (node, vars) => makeConstant(add(vars.c1.value - 1, vars.c2.value))),
  // createAdditionMistake(
  //  'ADDED_WITHOUT_ALIGNING_DIGITS',
  //  (node, vars) =>
  //    (vars.c1.value.toString().includes('-') || vars.c2.value.toString().includes('-')) // ignore negative numbers
  //      ? makeConstant(add(
  //      : makeConstant(Number.parseInt(`${vars.c1.value.toNumber()}${vars.c2.value.toNumber()}`)),
  // ),
  // createAdditionMistake('ADDED_WITH_PARTIAL_SUM', (node, vars) => makeConstant(vars.c1.value + (vars.c2.value % 10))),
]
// Subtraction Mistakes
const createSubtractionMistake = createMistake(OperationIds.SUBTRACT)
const subtractionMistakes = [
  // createSubtractionMistake('FORGOT_TO_BORROW_IN_SUBTRACTION', (node, vars) => makeConstant(vars.c1.value - (vars.c2.value % 10))),
  createSubtractionMistake('SUBTRACTED_IN_WRONG_DIRECTION', (node, vars) => makeConstant(subtract(vars.c2.value, vars.c1.value))),
  // createSubtractionMistake('SUBTRACTED_ONE_TOO_MANY', (node, vars) => makeConstant(subtract(vars.c1.value, vars.c2.value + 1))),
  // createSubtractionMistake('SUBTRACTED_ONE_TOO_FEW', (node, vars) => makeConstant(subtract(vars.c1.value, vars.c2.value - 1))),
  // createSubtractionMistake('FORGOT_TO_SUBTRACT_WHOLE_NUMBER', (node, vars) => makeConstant(vars.c1.value - (vars.c2.value % 10))),
  // createSubtractionMistake('SUBTRACTED_WITH_DIGIT_SWITCH', (node, vars) => makeConstant(math.abs((vars.c1.value % 10) - Math.floor(vars.c2.value / 10)))),
  // createSubtractionMistake('SUBTRACTED_TWICE', (node, vars) => makeConstant(subtract(subtract(vars.c1.value, vars.c2.value), vars.c2.value))),
]
// Multiplication Mistakes
const createMultiplicationMistake = createMistake(OperationIds.MULTIPLY)
const multiplicationMistakes = [
  createMultiplicationMistake('MULTIPLIED_WITHOUT_CARRYING', (node, vars) => makeConstant((vars.c1.value % 10) * (vars.c2.value % 10))),
  // createMultiplicationMistake('ADDED_INSTEAD_OF_MULTIPLIED', (node, vars) => makeConstant(add(vars.c1.value, vars.c2.value))),
  // createMultiplicationMistake('MULTIPLIED_ONE_TOO_MANY', (node, vars) => makeConstant(multiply(vars.c1.value + 1, vars.c2.value))),
  // createMultiplicationMistake('MULTIPLIED_ONE_TOO_FEW', (node, vars) => makeConstant(multiply(vars.c1.value - 1, vars.c2.value))),
  // createMultiplicationMistake('MULTIPLIED_BY_ZERO', (node, vars) => makeConstant(0)),
  // createMultiplicationMistake('MULTIPLIED_WITHOUT_ADDING_ZEROS', (node, vars) => makeConstant(multiply(vars.c1.value, vars.c2.value) % 10)),
  // createMultiplicationMistake('MULTIPLIED_WITH_INCORRECT_PLACE_VALUE', (node, vars) => makeConstant((vars.c1.value * 10) * vars.c2.value)),
]
// Division Mistakes
// const createDivisionMistake = createMistake(OperationIds.DIVIDE)
// const divisionMistakes = [
//  createDivisionMistake('DIVIDED_WITHOUT_REMAINDER', (node, vars) => makeConstant(Math.floor(vars.c1.value / vars.c2.value))),
//  createDivisionMistake('DIVIDED_BY_PARTIAL_VALUE', (node, vars) => makeConstant(Math.floor(vars.c1.value / (vars.c2.value % 10)))),
//  createDivisionMistake('INVERTED_DIVISOR_AND_DIVIDEND', (node, vars) => makeConstant(Math.floor(vars.c2.value / vars.c1.value))),
// ]
export const commonRuleMistakes = [
  ...additionMistakes,
  ...subtractionMistakes,
  // ...multiplicationMistakes,
  // ...divisionMistakes,
]