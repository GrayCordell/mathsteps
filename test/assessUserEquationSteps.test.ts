import { describe, it } from 'vitest'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { assertSpecifiedValues } from './util/assertHelpers'

const cleanMath = (str: string) => str?.replace('_', '').replace(' ', '').replace('[', '').replace(']', '').replace('\'', '').replace(`"`, '').replace('`', '')

type TestStep = Partial<StepInfo>
interface Test {
  description: string // Description of the test
  steps: string[] // The steps the user took. ['startingEquation', 'step1', 'step2', ...]
  // first array is the collection of entire steps
  // second array is the collection of steps that make up a user step
  //
  expectedAnalysis: TestStep[][][]
}
function testStepEvaluation(test: Test, index: number) {
  it(`test ${index + 1}: ${test.description}`, () => {
    let { steps, expectedAnalysis } = test
    steps = steps.map(cleanMath)

    const evaluatedSteps = assessUserEquationSteps(steps)
    for (let i = 0; i < expectedAnalysis.length; i++) {
      const leftExpected = expectedAnalysis[i][0]
      const rightExpected = expectedAnalysis[i][1]
      const leftAndRight = evaluatedSteps[i]
      for (let j = 0; j < leftExpected.length; j++) {
        const leftStepExpected = leftExpected[j]
        const rightStepExpected = rightExpected[j]
        const leftStep = leftAndRight.left[j]
        const rightStep = leftAndRight.right[j]
        assertSpecifiedValues(leftStep, leftStepExpected)
        assertSpecifiedValues(rightStep, rightStepExpected)
      }
    }
  })
}

describe('assessUserEquationStep', () => {
  const testCases: Test[] = [
    { // Test 1
      description: 'should return the correct transformation for 2x + 3 = 5 to 2x = 2',
      steps: ['2x + 3 = 5', '2x = 2'],
      expectedAnalysis: [
        // step 1
        [
          // left
          [{ from: '2x+3', to: '2x', isValid: true, attemptedToGetTo: '2x', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT', equationActionType: 'REMOVE_TERM' }],
          // right
          [{ from: '5', to: '2', isValid: true, attemptedToGetTo: '2', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' }],
        ],
      ],
    },
    { // Test 2
      description: 'works with no transformation, division',
      steps: ['4x + (8 / 2) = 5', '4x + 4 = 5'],
      expectedAnalysis: [
        // step 1
        [
          // left
          [{ from: '4x+(8/2)', to: '4x+4', isValid: true, attemptedToGetTo: '4x+4', attemptedChangeType: 'CANCEL_TERMS' }],
          // right
          [{ from: '5', to: '5', isValid: false, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN', mistakenChangeType: 'NO_CHANGE' }], // TODO make valid
        ],
      ],
    },
    { // Test 3
      description: '3',
      steps: [
        '5x-4+5=5',
        '5x-4=0',
        '5x=4',
      ],
      expectedAnalysis: [
        // step 1
        [
          // left
          [{ from: '5x-4+5', to: '5x-4', isValid: true, attemptedToGetTo: '5x-4', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT', equationActionType: 'REMOVE_TERM' }],
          // right
          [{ from: '5', to: '0', isValid: true, attemptedToGetTo: '0', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' }],
        ],
        // step 2
        [
          // left
          [{ from: '5x-4', to: '5x', isValid: true, attemptedToGetTo: '5x', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD', equationActionType: 'REMOVE_TERM' }],
          // right
          [{ from: '0', to: '4', isValid: true, attemptedToGetTo: '4', attemptedChangeType: 'REMOVE_ADDING_ZERO' }],
        ],
      ],
    },
    { // Test 4
      description: '4',
      steps: [
        '3x+4-5=5',
        '3x+4=10',
        '3x=6',
      ],
      expectedAnalysis: [
        // step 1
        [
          // left
          [{ from: '3x+4-5', to: '3x+4', isValid: true, attemptedToGetTo: '3x+4', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD', equationActionType: 'REMOVE_TERM' }],
          // right
          [{ from: '5', to: '10', isValid: true, attemptedToGetTo: '10', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD' }],
        ],
        // step 2
        [
          // left
          [{ from: '3x+4', to: '3x', isValid: true, attemptedToGetTo: '3x', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT', equationActionType: 'REMOVE_TERM' }],
          // right
          [{ from: '10', to: '6', isValid: true, attemptedToGetTo: '6', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' }],
        ],
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
        [
          // Left side changes
          [
            { // implicit "skipped" step
              from: '2x + 3 + 5 + 6',
              to: '2x + 8 + 6',
              isValid: true,
              attemptedToGetTo: '2x + 8 + 6',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            },
            { // implicit "skipped" step
              from: '2x + 8 + 6',
              to: '2x + 14',
              isValid: true,
              attemptedToGetTo: '2x + 14',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            },
          ],
          // Right side remains unchanged
          [
            {
              from: '5x - 2',
              to: '5x - 2',
              isValid: false,
              attemptedToGetTo: 'UNKNOWN',
              attemptedChangeType: 'UNKNOWN',
              mistakenChangeType: 'NO_CHANGE',
            },
            {
              from: '5x - 2',
              to: '5x - 2',
              isValid: false,
              attemptedToGetTo: 'UNKNOWN',
              attemptedChangeType: 'UNKNOWN',
              mistakenChangeType: 'NO_CHANGE',
            },
          ],
        ],
        // Step 2: Subtract 2x from both sides
        [
          // Left side changes
          [
            {
              from: '2x + 14',
              to: '14',
              isValid: true,
              attemptedToGetTo: '14',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
              equationActionType: 'REMOVE_TERM',
            },
          ],
          // Right side changes
          [
            {
              from: '5x - 2',
              to: '3x - 2',
              isValid: true,
              attemptedToGetTo: '3x - 2',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
            },
          ],
        ],
        // Step 3: Add 2 to both sides
        [
          // Left side changes
          [
            {
              from: '14',
              to: '16',
              isValid: true,
              attemptedToGetTo: '16',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            },
          ],
          // Right side changes
          [
            {
              from: '3x - 2',
              to: '3x',
              isValid: true,
              attemptedToGetTo: '3x',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
              equationActionType: 'REMOVE_TERM',
            },
          ],
        ],
        // Step 4: Divide by 3
        [
          // Left side changes
          [{
            from: '16',
            to: '16/3',
            isValid: true,
            attemptedToGetTo: '16/3',
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__DIVIDE',
          }],
          // Right side changes
          [{
            from: '3x',
            to: 'x',
            isValid: true,
            attemptedToGetTo: 'x',
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__DIVIDE',
            equationActionType: 'REMOVE_TERM',
          }],
        ],
        // Step 5: Flip sides
        [
          // Left side changes
          [{
            from: '16/3',
            to: 'x',
            isValid: true,
            attemptedToGetTo: 'x',
            attemptedChangeType: 'SWAP_SIDES',
            equationActionType: 'SWAP_SIDES',
          }],
          // Right side changes
          [{
            from: 'x',
            to: '16/3',
            isValid: true,
            attemptedToGetTo: '16/3',
            attemptedChangeType: 'SWAP_SIDES',
            equationActionType: 'SWAP_SIDES',
          }],
        ],
      ],
    },
  ]
  testCases.forEach((test, index) => testStepEvaluation(test, index))
})
