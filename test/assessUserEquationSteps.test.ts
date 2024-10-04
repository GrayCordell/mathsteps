import { describe, it } from 'vitest'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { assertSpecifiedValues } from './util/assertHelpers'

// Error.stackTraceLimit = 100
const removeTheseChars = ['_', ' ', '[', ']', '\'', '"', '`']
const cleanMath = <T>(str: T): T => {
  if (!str)
    return str

  const str2 = str as string
  return removeTheseChars.reduce((acc, char) => {
    return acc.replace(new RegExp(`[${char}]`, 'g'), '')
  }, str2) as T
}

type TestStep = Partial<StepInfo>
interface Test {
  description: string // Description of the test
  steps: string[] // The steps the user took. ['startingEquation', 'step1', 'step2', ...]
  // first array is the collection of entire steps
  // second array is the collection of steps that make up a user step
  //
  expectedAnalysis: [TestStep[], TestStep[]][]
}
function testStepEvaluation(test: Test, index: number) {
  it(`test ${index + 1}: ${test.description}`, () => {
    let { steps, expectedAnalysis } = test
    steps = steps.map(cleanMath)
    expectedAnalysis = expectedAnalysis.map(([left, right]) => ([
      left.map(step => step ? { ...step, from: cleanMath(step.from), to: cleanMath(step.to) } : step),
      right.map(step => step ? { ...step, from: cleanMath(step.from), to: cleanMath(step.to) } : step),
    ]))

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
        if (!leftStep && leftStepExpected) {
          throw new Error(`You have more steps than expected ${JSON.stringify(leftExpected)}`)
        }
        if (!rightStep && rightStepExpected) {
          throw new Error(`You have more steps than expected. ${JSON.stringify(rightExpected)}`)
        }
        assertSpecifiedValues(leftStep, leftStepExpected)
        assertSpecifiedValues(rightStep, rightStepExpected)
      }
    }
  })
}

describe('assessUserEquationStep', () => {
  const testCases: Test[] = [
    /* { // Test 1
      description: 'should return the correct transformation for 2x + 3 = 5 to 2x = 2',
      steps: ['2x + 3 = 5', '2x = 2'],
      expectedAnalysis: [
        // step 1
        [
          // left
          [
            { from: '2x+3', to: '2x+3-3', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '2x+3-3', to: '2x + 0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '5', to: '5-3', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5-3', to: '2', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
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
          [{ from: '5', to: '5', isValid: false, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'NO_CHANGE', mistakenChangeType: 'NO_CHANGE' }], // TODO make valid
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
          [
            { from: '5x-4+5', to: '5x-4+5-5', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '5x-4+5-5', to: '5x+-4+0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '5x+-4+0', to: '5x + -4', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '5', to: '5 - 5', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '5 - 5', to: '0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        ],
        // step 2
        [
          // left
          [
            { from: '5x-4', to: '5x - 4 + 4', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '5x - 4 + 4', to: '5x + - 0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '5x + - 0', to: '5x', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '0', to: '0 + 4', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '0 + 4', to: '4', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
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
          [
            { from: '3x+4-5', to: '3x+4-5+5', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x+4-5+5', to: '3x+4+0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x+4+0', to: '3x+4', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '5', to: '5+5', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5+5', to: '10', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD' },
          ],
        ],
        // step 2
        [
          // left
          [
            { from: '3x+4', to: '3x+4-4', isValid: true, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x+4-4', to: '3x + 0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', isValid: true, attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '10', to: '10-4', isValid: true, attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '10-4', to: '6', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
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
              attemptedChangeType: 'NO_CHANGE',
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
              to: '(2x+14) - (2x)',
              isValid: true,
              attemptedChangeType: 'EQ_REMOVE_TERM',
            },
            {
              from: '(2x+14) - (2x)',
              to: '14',
              isValid: true,
              attemptedChangeType: 'CANCEL_TERMS',
            },
          ],
          // Right side changes
          [
            {
              from: '5x - 2',
              to: '5x - 2 + -2x',
              isValid: true,
              attemptedChangeType: 'EQ_ADD_TERM',
            },
            {
              from: '5x - 2 + -2x',
              to: '-2+(-2+5)*x',
              isValid: true,
              attemptedChangeType: 'COLLECT_AND_COMBINE_LIKE_TERMS',
            },
            {
              from: '(5+-2)*x+-2',
              to: '3x - 2',
              isValid: true,
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
              to: '14 + 2',
              isValid: true,
              attemptedChangeType: 'EQ_ADD_TERM',
            },
            {
              from: '14 + 2',
              to: '16',
              isValid: true,
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            },
          ],
          // Right side changes
          [
            {
              from: '3x - 2',
              to: '3x - 2 + 2',
              isValid: true,
              attemptedChangeType: 'EQ_REMOVE_TERM',
            },
            {
              from: '3x - 2 + 2',
              to: '3x + 0',
              isValid: true,
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
            },
            {
              from: '3x + 0',
              to: '3x',
              isValid: true,
              attemptedChangeType: 'REMOVE_ADDING_ZERO',
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
            attemptedChangeType: 'EQ_ADD_TERM',
          }],
          // Right side changes
          [
            {
              from: '3x',
              to: '3x/3',
              isValid: true,
              attemptedChangeType: 'EQ_REMOVE_TERM',
            },
            {
              from: '3x/3',
              to: 'x',
              isValid: true,
              attemptedChangeType: 'CANCEL_TERMS',
            },
          ],
        ],
        // Step 5: Flip sides
        [
          // Left side changes
          [{
            from: '16/3',
            to: 'x',
            isValid: true,
            attemptedToGetTo: 'x',
            attemptedChangeType: 'EQ_SWAP_SIDES',
            equationActionType: 'EQ_SWAP_SIDES',
          }],
          // Right side changes
          [{
            from: 'x',
            to: '16/3',
            isValid: true,
            attemptedToGetTo: '16/3',
            attemptedChangeType: 'EQ_SWAP_SIDES',
            equationActionType: 'EQ_SWAP_SIDES',
          }],
        ],
      ],
    },
    { // Test 6
      description: '6',
      steps: [
        '3x + 5 = 11',
        '3x/3 = 6/3',
      ],
      expectedAnalysis: [
        // Step 1: Subtract 5 from both sides & divide both sides by 3
        [
          // Left side changes
          [
            // part 1: subtract 5 from both sides
            {
              from: '3x + 5',
              to: '3x + 5 + -5',
              isValid: true,
              attemptedChangeType: 'EQ_REMOVE_TERM',
              // equationActionType: 'EQ_REMOVE_TERM',
            },
            // part 2: simplify 5 + -5
            {
              from: '3x + 5 + -5',
              to: '3x + 0',
              isValid: true,
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
              // equationActionType: 'EQ_REMOVE_TERM',
            },
            // part 3: remove adding 0
            {
              from: '3x + 0',
              to: '3x',
              isValid: true,
              attemptedChangeType: 'REMOVE_ADDING_ZERO',
            },
            // part 4: divide both sides by 3
            {
              from: '3x',
              to: '3x/3',
              isValid: true,
              attemptedChangeType: 'EQ_REMOVE_TERM',
            },
            /// / part 5: simplify 3/3
            // {
            //  from: '3x',
            //  to: '3x/3',
            //  isValid: true,
            //  attemptedChangeType: 'SIMPLIFY_ARITHMETIC__DIVIDE',
            // },
          ],
          // Right side changes
          [
            // part 1: subtract 5 from both sides
            {
              from: '11',
              to: '11 + -5',
              isValid: true,
              attemptedChangeType: 'EQ_ADD_TERM',
              // equationActionType: 'EQ_REMOVE_TERM',
            },
            // part 2: simplify 11 + -5
            {
              from: '11 + -5',
              to: '6',
              isValid: true,
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
              // equationActionType: 'EQ_REMOVE_TERM',
            },
            // part 3: divide both sides by 3
            {
              from: '6',
              to: '6/3',
              isValid: true,
              attemptedChangeType: 'EQ_ADD_TERM',
            },
          ],
        ],

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
        [
          // Left
          [
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
          // Right
          [
            {
              from: '5',
              to: '5 * 4',
              attemptedChangeType: 'EQ_ADD_TERM',
            },
            {
              from: '5 * 4',
              to: '20',
              attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
            },
          ],
        ],
        // Step 2: Subtract 8 from both sides
        [
          // left
          [
            { from: '3x + 8', to: '3x + 8 - 8', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x + 8 - 8', to: '3x + 0', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // right
          [
            { from: '20', to: '20 - 8', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '20 - 8', to: '12', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        ],
        // Step 3: Divide both by 3
        [
          // left
          [
            { from: '3x', to: '3x/3', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x/3', to: 'x', attemptedChangeType: 'CANCEL_TERMS' },
          ],
          // right
          [
            { from: '12', to: '12/3', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '12/3', to: '4', attemptedChangeType: 'CANCEL_TERMS' }, // TODO should this be cancel terms?
          ],
        ],
      ],
    },
    {
      description: '8 -  be unknown',
      steps: [
        '3x / 4 + 2 = 5',
        '3x/4 + 2/4 = 5',
        '3x + 2 = 20',
        '3x = 18',
      ],
      expectedAnalysis: [
        // Step 1: Multiply only 2 randomly by 4
        [
          // Left
          [
            { from: '3x/4 + 2', to: '3x/4 + 2/4', attemptedChangeType: 'UNKNOWN', isValid: false },
          ],
          // Right
          [
            { from: '5', to: '5', attemptedChangeType: 'NO_CHANGE', isValid: false },
          ],
        ],
        // Step 2: Multiply both sides by 4
        [
          // Left
          [
            { from: '3x/4 + 2/4', to: '(3x/4 + 2/4) * 4', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '(3x/4 + 2/4) * 4', to: '3x/4 * 4 + 2/4 * 4', attemptedChangeType: 'KEMU_DISTRIBUTE_MUL_OVER_ADD' },
            { from: '3x/4 * 4 + 2/4 * 4', to: '3x/4*4+2', attemptedChangeType: 'CANCEL_TERMS' },
            { from: '3x/4*4+2', to: '3x + 2', attemptedChangeType: 'CANCEL_TERMS' },
          ],
          // Right
          [
            { from: '5', to: '5 * 4', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '5 * 4', to: '20', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY' },
          ],
        ],
        // Step 3: Subtract 2 from both sides
        [
          // Left
          [
            { from: '3x + 2', to: '3x + 2 - 2', attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x + 2 - 2', to: '3x + 0', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
            { from: '3x + 0', to: '3x', attemptedChangeType: 'REMOVE_ADDING_ZERO' },
          ],
          // Right
          [
            { from: '20', to: '20 - 2', attemptedChangeType: 'EQ_ADD_TERM' },
            { from: '20 - 2', to: '18', attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        ],


      ],
    }, */
    { // Test 9
      description: 'ssss',
      steps: ['3x = 3', 'x=0'],
      expectedAnalysis: [
        // step 1
        [
          // left
          [
            { from: '3x', to: '3x/3', isValid: false, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3x/3', to: 'x', isValid: true, attemptedChangeType: 'CANCEL_TERMS' },
          ],
          // right
          [
            { from: '3', to: '3-3', isValid: false, attemptedChangeType: 'EQ_REMOVE_TERM' },
            { from: '3-3', to: '0', isValid: true, attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
          ],
        ],
      ],
    },
  ]
  testCases.forEach((test, index) => testStepEvaluation(test, index))
})
