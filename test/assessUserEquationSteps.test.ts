import { describe, it } from 'vitest'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType, AEquationChangeType } from '~/types/changeType/ChangeTypes'
import { assertObjectEqual, assertSpecifiedValues } from './util/assertHelpers'

/**
 * Characters to remove from mathematical expressions.
 */
const removeTheseChars = ['_', ' ', '[', ']', '\'', '"', '`']

/**
 * Cleans mathematical expressions by removing specified characters.
 * @param str - The string to clean.
 * @returns The cleaned string.
 */
const cleanMath = <T>(str: T): T => {
  if (!str || typeof str !== 'string')
    return str
  return removeTheseChars.reduce((acc, char) => acc.replace(new RegExp(`[${char}]`, 'g'), ''), str) as T
}

/**
 * Default properties for a test step.
 */
const defaultStepInfo: Partial<StepInfo> = {
  isValid: true,
}

/**
 * Generates a test step with specified properties.
 * @param from - The original expression.
 * @param to - The transformed expression.
 * @param attemptedChangeType - The type of change attempted.
 * @param additionalProps - Any additional properties to include.
 * @returns A partially filled StepInfo object.
 */
function generateStep(
  from: string,
  to: string,
  attemptedChangeType: AChangeType,
  additionalProps: Partial<StepInfo> = {},
): Partial<StepInfo> {
  return {
    ...defaultStepInfo,
    from: cleanMath(from),
    to: cleanMath(to),
    attemptedChangeType,
    ...additionalProps,
  }
}

/**
 * Generates a test step representing no change.
 * @param expression - The expression that remains unchanged.
 * @param additionalProps - Any additional properties to include.
 * @returns A partially filled StepInfo object indicating no change.
 */
function generateNoChangeStep(
  expression: string,
  additionalProps: Partial<StepInfo> = {},
): Partial<StepInfo> {
  return {
    from: cleanMath(expression),
    to: cleanMath(expression),
    isValid: false,
    attemptedToGetTo: 'UNKNOWN',
    attemptedChangeType: 'NO_CHANGE',
    mistakenChangeType: 'NO_CHANGE',
    ...additionalProps,
  }
}

type TestStep = Partial<StepInfo>

interface Test {
  description: string
  steps: string[]
  expectedAnalysis: {
    overallStepEval?: {
      reachesOriginalAnswer?: boolean
      attemptedEquationChangeType?: AEquationChangeType
      equationErrorType?: AEquationChangeType
      [key: string]: any
    }
    left: TestStep[]
    right: TestStep[]
  }[]
}

/**
 * Function to evaluate test steps.
 */
function testStepEvaluation(test: Test, index: number) {
  it(`test ${index + 1}: ${test.description}`, () => {
    let { steps, expectedAnalysis } = test
    steps = steps.map(cleanMath)
    const cleanedExpectedAnalysis = expectedAnalysis.map(step => ([
      step.left.map(step => step ? { ...step, from: cleanMath(step.from), to: cleanMath(step.to) } : step),
      step.right.map(step => step ? { ...step, from: cleanMath(step.from), to: cleanMath(step.to) } : step),
    ]))

    const evaluatedSteps = assessUserEquationSteps(steps)
    for (let i = 0; i < expectedAnalysis.length; i++) {
      const leftExpected = cleanedExpectedAnalysis[i][0]
      const rightExpected = cleanedExpectedAnalysis[i][1]
      const leftAndRight = evaluatedSteps[i]
      for (let j = 0; j < leftExpected.length; j++) {
        const leftStepExpected = leftExpected[j]
        const rightStepExpected = rightExpected[j]
        const leftStep = leftAndRight.left[j]
        const rightStep = leftAndRight.right[j]
        if (!leftStep && leftStepExpected) {
          throw new Error(`You have more steps than expected ${JSON.stringify(leftExpected)}`)
        }
        if (!rightStep && rightStepExpected) {
          throw new Error(`You have more steps than expected. ${JSON.stringify(rightExpected)}`)
        }
        assertSpecifiedValues(leftStep, leftStepExpected)
        assertSpecifiedValues(rightStep, rightStepExpected)
      }
      // check overall checks
      assertObjectEqual({ ...leftAndRight }, expectedAnalysis[i].overallStepEval)
    }
  })
}


describe('assessUserEquationStep', () => {
  const testCases: Test[] = [
    { // Test 1
      description: 'should return the correct transformation for 2x + 3 = 5 to 2x = 2',
      steps: ['2x + 3 = 5', '2x = 2'],
      expectedAnalysis: [
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('2x+3', '2x+3-3', 'EQ_REMOVE_TERM'),
            generateStep('2x+3-3', '2x+0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('2x+0', '2x', 'REMOVE_ADDING_ZERO'),
          ],
          right: [
            generateStep('5', '5-3', 'EQ_ADD_TERM'),
            generateStep('5-3', '2', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
          ],
        },
      ],
    },
    { // Test 2
      description: 'works with no transformation, division',
      steps: ['4x + (8 / 2) = 5', '4x + 4 = 5'],
      expectedAnalysis: [
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('4x+(8/2)', '4x+4', 'CANCEL_TERMS', { attemptedToGetTo: '4x+4' }),
          ],
          right: [
            generateNoChangeStep('5'),
          ],
        },
      ],
    },
    { // Test 3
      description: 'Simplify and solve equation with multiple steps',
      steps: ['5x-4+5=5', '5x-4=0', '5x=4'],
      expectedAnalysis: [
        // Step 1
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('5x-4+5', '5x-4+5-5', 'EQ_REMOVE_TERM'),
            generateStep('5x-4+5-5', '5x+-4+0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('5x+-4+0', '5x+-4', 'REMOVE_ADDING_ZERO'),
          ],
          right: [
            generateStep('5', '5-5', 'EQ_REMOVE_TERM'),
            generateStep('5-5', '0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
          ],
        },
        // Step 2
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('5x-4', '5x-4+4', 'EQ_REMOVE_TERM'),
            generateStep('5x-4+4', '5x+0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('5x+0', '5x', 'REMOVE_ADDING_ZERO'),
          ],
          right: [
            generateStep('0', '0+4', 'EQ_ADD_TERM'),
            generateStep('0+4', '4', 'REMOVE_ADDING_ZERO'),
          ],
        },
      ],
    },
    { // Test 4
      description: 'Equation solving with addition and subtraction',
      steps: ['3x+4-5=5', '3x+4=10', '3x=6'],
      expectedAnalysis: [
        // Step 1
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('3x+4-5', '3x+4-5+5', 'EQ_REMOVE_TERM'),
            generateStep('3x+4-5+5', '3x+4+0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('3x+4+0', '3x+4', 'REMOVE_ADDING_ZERO'),
          ],
          right: [
            generateStep('5', '5+5', 'EQ_ADD_TERM'),
            generateStep('5+5', '10', 'SIMPLIFY_ARITHMETIC__ADD'),
          ],
        },
        // Step 2
        {
          overallStepEval: { reachesOriginalAnswer: true },
          left: [
            generateStep('3x+4', '3x+4-4', 'EQ_REMOVE_TERM'),
            generateStep('3x+4-4', '3x+0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('3x+0', '3x', 'REMOVE_ADDING_ZERO'),
          ],
          right: [
            generateStep('10', '10-4', 'EQ_ADD_TERM'),
            generateStep('10-4', '6', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
          ],
        },
      ],
    },
    { // Test 5
      description: '5',
      steps: [
        '2x + 3 + 5 + 6 = 5x - 2',
        '2x + 14 = 5x - 2',
        '14 = 3x - 2',
        '16 = 3x',
        '16/3 = x',
        'x = 16/3',
      ],
      expectedAnalysis: [
        // Step 1: 2x + 3 + 5 + 6 -> 2x + 14. right stays same as 5x - 2. 2 implicit steps skipped
        {
          overallStepEval: {
            reachesOriginalAnswer: true,
            attemptedEquationChangeType: 'EQ_SIMPLIFY_LHS',
          },
          left: [
            { from: '2x + 3 + 5 + 6', to: '2x + 8 + 6', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD' },
            { from: '2x + 8 + 6', to: '2x + 14', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD' },
          ],
          right: [
            { from: '5x - 2', to: '5x - 2', isValid: false, attemptedChangeType: 'NO_CHANGE', mistakenChangeType: 'NO_CHANGE' },
          ],
        },
        // Step 2: Subtract 2x from both sides
        {
          overallStepEval: {
            reachesOriginalAnswer: true,
            attemptedEquationChangeType: 'EQ_ATMPT_OP_BOTH_SIDES',
          },
          left: [
            { from: '2x + 14', to: '(2x+14) - (2x)', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '(2x+14) - (2x)', to: '14', isValid: true, attemptedChangeType: 'CANCEL_TERMS' },
          ],
          right: [
            { from: '5x - 2', to: '5x - 2 + -2x', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5x - 2 + -2x', to: '-2+(-2+5)*x', isValid: true, attemptedChangeType: 'COLLECT_AND_COMBINE_LIKE_TERMS' },
            { from: '(5+-2)*x+-2', to: '3x - 2', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        },
        // Step 3: Add 2 to both sides
        {
          left: [
            { from: '14', to: '14 + 2', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '14 + 2', to: '16', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD' },
          ],
          right: [
            { from: '3x - 2', to: '3x - 2 + 2', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x - 2 + 2', to: '3x + 0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
        },
        // Step 4: Divide by 3
        {
          left: [{ from: '16', to: '16/3', isValid: true, attemptedChangeType: 'EQ_ADD_TERM',
          }],
          right: [
            { from: '3x', to: '3x/3', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x/3', to: 'x', isValid: true, attemptedChangeType: 'CANCEL_TERMS' },
          ],
        },
        // Step 5: Flip sides
        {
          left: [{ from: '16/3', to: 'x', isValid: true, attemptedToGetTo: 'x', attemptedChangeType: 'EQ_SWAP_SIDES', equationActionType: 'EQ_SWAP_SIDES' }],
          right: [{ from: 'x', to: '16/3', isValid: true, attemptedToGetTo: '16/3', attemptedChangeType: 'EQ_SWAP_SIDES', equationActionType: 'EQ_SWAP_SIDES' }],
        },
      ],
    },
    { // Test 6
      description: '6',
      steps: [
        '3x + 5 = 11',
        '3x/3 = 6/3',
      ],
      expectedAnalysis: [
        {
          left: [
            generateStep('3x + 5', '3x + 5 + -5', 'EQ_REMOVE_TERM'),
            generateStep('3x + 5 + -5', '3x + 0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('3x + 0', '3x', 'REMOVE_ADDING_ZERO'),
            generateStep('3x', '3x/3', 'EQ_REMOVE_TERM'),
          ],
          right: [
            generateStep('11', '11 + -5', 'EQ_ADD_TERM'),
            generateStep('11 + -5', '6', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
            generateStep('6', '6/3', 'EQ_ADD_TERM'),
          ],
        },
      ],
    },
    { // Test 7
      description: '7',
      steps: [
        '3x/4 + 2 = 5',
        '3x + 8 = 20',
        '3x = 12',
        'x = 4',
      ],
      expectedAnalysis: [
        // Step 1: Multiply both sides by 4
        {
          left: [
            {
              from: '3x/4 + 2',
              to: '(3x/4+2) * (4)',
              attemptedChangeType: 'EQ_REMOVE_TERM',
            },
            {
              from: '(3x/4+2) * (4)',
              to: '3x/4*4+2*4',
              attemptedChangeType: 'KEMU_DISTRIBUTE_MUL_OVER_ADD',
            },
            {
              from: '3x/4*4+2*4',
              to: '3x/4*4+8',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
            },
            {
              from: '3x/4*4+8',
              to: '3x+8',
              attemptedChangeType: 'CANCEL_TERMS',
            },
          ],
          right: [
            { from: '5', to: '5 * 4', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5 * 4', to: '20', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY' },
          ],
        },
        // Step 2: Subtract 8 from both sides
        {
          left: [
            { from: '3x + 8', to: '3x + 8 - 8', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x + 8 - 8', to: '3x + 0', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          right: [
            { from: '20', to: '20 - 8', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '20 - 8', to: '12', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        },
        // Step 3: Divide both by 3
        {
          left: [
            { from: '3x', to: '3x/3', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x/3', to: 'x', attemptedChangeType: 'CANCEL_TERMS' },
          ],
          right: [
            { from: '12', to: '12/3', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '12/3', to: '4', attemptedChangeType: 'CANCEL_TERMS' },
          ],
        },
      ],
    },
    { // Test 8
      description: '8 -  be unknown',
      steps: [
        '3x / 4 + 2 = 5',
        '3x/4 + 2/4 = 5',
        '3x + 2 = 20',
        '3x = 18',
      ],
      expectedAnalysis: [
        // Step 1: Multiply only 2 randomly by 4
        {
          overallStepEval: {
            reachesOriginalAnswer: false,
          },
          left: [
            { from: '3x/4 + 2', to: '3x/4 + 2/4', attemptedChangeType: 'UNKNOWN', isValid: false },
          ],
          right: [
            { from: '5', to: '5', attemptedChangeType: 'NO_CHANGE', isValid: false },
          ],
        },
        // Step 2: Multiply both sides by 4
        {
          left: [
            { from: '3x/4 + 2/4', to: '(3x/4 + 2/4) * 4', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '(3x/4 + 2/4) * 4', to: '3x/4 * 4 + 2/4 * 4', attemptedChangeType: 'KEMU_DISTRIBUTE_MUL_OVER_ADD' },
            { from: '3x/4 * 4 + 2/4 * 4', to: '3x/4*4+2', attemptedChangeType: 'CANCEL_TERMS' },
            { from: '3x/4*4+2', to: '3x + 2', attemptedChangeType: 'CANCEL_TERMS' },
          ],
          right: [
            { from: '5', to: '5 * 4', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5 * 4', to: '20', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY' },
          ],
        },
        // Step 3: Subtract 2 from both sides
        {
          overallStepEval: {
            reachesOriginalAnswer: false,
            attemptedEquationChangeType: 'EQ_ATMPT_OP_BOTH_SIDES',
          },
          left: [
            { from: '3x + 2', to: '3x + 2 - 2', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x + 2 - 2', to: '3x + 0', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          right: [
            { from: '20', to: '20 - 2', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '20 - 2', to: '18', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        },
      ],
    },
    { // Test 9
      description: '9. error - x=0 last step case. Error: remove term from both sides',
      steps: ['3x = 3', 'x=0'],
      expectedAnalysis: [
        {
          overallStepEval: {
            reachesOriginalAnswer: false,
            equationErrorType: 'EQ_ATMPT_REMOVAL_BOTH_SIDES',
          },
          left: [
            generateStep('3x', '3x/3', 'EQ_REMOVE_TERM', { isValid: false }),
            generateStep('3x/3', 'x', 'CANCEL_TERMS'),
          ],
          right: [
            generateStep('3', '3-3', 'EQ_REMOVE_TERM', { isValid: false }),
            generateStep('3-3', '0', 'SIMPLIFY_ARITHMETIC__SUBTRACT'),
          ],
        },
      ],
    },
    { // Test 10
      description: '10. error - attempt add term to both sides',
      steps: ['10x = 4', '10x - 4 = 4 - 10x'],
      expectedAnalysis: [
        {
          overallStepEval: {
            equationErrorType: 'EQ_ADDED_DIFF_TERMS_TO_BOTH_SIDES',
          },
          left: [
            generateStep('10x', '10x-4', 'EQ_ADD_TERM', { isValid: false }),
          ],
          right: [
            generateStep('4', '4-10x', 'EQ_ADD_TERM', { isValid: false }),
          ],
        },
      ],
    },
  ]

  testCases.forEach((test, index) => testStepEvaluation(test, index))
})
