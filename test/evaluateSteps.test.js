import { CANCEL_TERMS, COLLECT_AND_COMBINE_LIKE_TERMS, KEMU_DECIMAL_TO_FRACTION, MULTIPLY_BY_ZERO, MULTIPLY_FRACTIONS, REMOVE_ADDING_ZERO, REMOVE_MULTIPLYING_BY_ONE, SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__MULTIPLY } from '~/types/ChangeTypes'
import { ADDED_INSTEAD_OF_MULTIPLIED, ADDED_ONE_TOO_MANY, MULTIPLIED_ONE_TOO_MANY } from '~/types/ErrorTypes'
import { describe, it } from 'vitest'
import { evaluateUserSteps } from '~/simplifyExpression/stepEvaluationCore.js'
import { assertSpecifiedValues } from './util/assertHelpers.js'

function testStepEvaluation(test, index) {
  it(`test ${index + 1}: ${test.description}`, () => {
    const { steps, expectedStepAnalysis } = test
    const evaluatedSteps = evaluateUserSteps(steps)

    for (let i = 0; i < evaluatedSteps.length; i++) {
      const stepsSteps = evaluatedSteps[i] // StepSteps because some steps can be implicit/skipped, but its still 1 users step.
      const expectedStepSteps = expectedStepAnalysis[i]

      for (let j = 0; j < stepsSteps.length; j++) {
        const step = stepsSteps[j]
        const expectedStep = expectedStepSteps[j]
        assertSpecifiedValues(step, expectedStep)
      }
    }
  })
}
/* type AnalyzedSteps = {
  availableChangeTypes: Array<string>, // all possible change types that could have been used to get to the next step.
  isValid: boolean, // if the step is correct based only on moving from the previous step. It does not have to reach the original answer.
  reachesOriginalAnswer: boolean, // if the step would reach the original questions answer.
  from: string, // the equation before the step.
  to: string, // the equation after the step.
  attemptedChangeType: ChangeType || 'UNKNOWN', // the change type that the user attempted to use to get to the next step. If we don't know what they were trying to do it will be 'UNKNOWN'.
  attemptedToGetTo: string | 'UNKNOWN', // the equation that the user was trying to get to.(After The attempted change type). If we don't know what they were trying to get to it will be 'UNKNOWN'.
  mistakenChangeType: null | MistakeChangeType | 'UNKNOWN', // if the user made a mistake, what type of mistake was it. If we haven't specified a mistake type it will be 'UNKNOWN'.
} */

/**
 * @description Helper function so we don't have to specify all the values for each step.
 * It will fill in the missing values with defaults.
 * This is helpful because some values are always the same if everything should be correct.
 *
 * @param correctStepStepsArr Array<Array<AnalyzedStepsWithSomeMissingProperties>>
 * @returns {Array<Array<AnalyzedSteps>>}
 */
function makeCorrectStepsUtil(correctStepStepsArr) {
  let lastStep = null

  correctStepStepsArr = correctStepStepsArr.map((stepSteps) => {
    return stepSteps.map((step) => {
      // If no from lets just use the last step as the from.
      if (lastStep && step.from === undefined)
        step.from = lastStep
      lastStep = step.to

      const onUndefinedUseDefault = (value, defaultValue) => value === undefined ? defaultValue : value

      return {
        availableChangeTypes: step.availableChangeTypes,
        reachesOriginalAnswer: onUndefinedUseDefault(step.reachesOriginalAnswer, true),
        isValid: onUndefinedUseDefault(step.isValid, true),
        attemptedChangeType: step.attemptedChangeType,
        from: step.from,
        to: step.to,
        attemptedToGetTo: onUndefinedUseDefault(step.attemptedToGetTo, step.to),
        mistakenChangeType: onUndefinedUseDefault(step.mistakenChangeType, null),
      }
    })
  })

  return correctStepStepsArr
}

describe('addition Success', () => {
  const additionSuccessCases = [
    // Test 1
    {
      description: 'Simple Addition',
      steps: [
        '5 + 5', // Starting equation
        '10', // Step 1 from user
      ],
      // NOTE THAT makeCorrectStepsUtil WILL FILL IN THE MISSING VALUES WITH DEFAULTS.
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5 + 5',
            to: '10',
          },
          // Add more here if step1 has more than one step implicit in it. "skipped" steps.
        ],
        // No Step 2
      ]),
    },
    // Test 2
    {
      description: 'Simple Addition, 1 implicit skipped step',
      steps: [
        '5 + 5 + 5', // Starting equation
        '15', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          { // implcit in step 1, it had to be done to get to the next step.
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5 + 5 + 5',
            to: '10 + 5',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '15',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 3
    {
      description: 'Simple Addition of three numbers',
      steps: [
        '3 + 7 + 10', // Starting equation
        '20', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          { // implicit in step 1, had to be done to get to the next step.
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '3 + 7 + 10',
            to: '10 + 10',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '20',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 4
    {
      description: 'Addition with zero',
      steps: [
        '8 + 0 + 4', // Starting equation
        '12', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          {
            availableChangeTypes: [REMOVE_ADDING_ZERO, SIMPLIFY_ARITHMETIC__ADD, COLLECT_AND_COMBINE_LIKE_TERMS],
            attemptedChangeType: REMOVE_ADDING_ZERO,
            from: '8 + 0 + 4',
            to: '8 + 4',
          },
          {
            availableChangeTypes: [REMOVE_ADDING_ZERO, SIMPLIFY_ARITHMETIC__ADD], // TODO not sure why REMOVE_ADDING_ZERO has to be here
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '12',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 5
    {
      description: 'Addition with negative numbers',
      steps: [
        '5 + (-3) + 2', // Starting equation
        '4', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5 + (-3) + 2',
            to: '2 + 2',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '4',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 6
    {
      description: 'Addition with multiple terms including negative numbers',
      steps: [
        '7 + (-2) + 3 + (-1)', // Starting equation
        '7', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        // Step 1
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '7 + (-2) + 3 + (-1)',
            to: '5 + 3 + (-1)',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '8 + (-1)',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '7',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 7
    {
      description: 'Addition with large numbers',
      steps: [
        '500 + 300 + 200', // Starting equation
        '1000', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [ // Step 1
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '500 + 300 + 200',
            to: '800 + 200',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            to: '1000',
          },
        ], // No Step 2
      ]),
    },
    // Test 7
    {
      description: 'Addition with decimal numbers',
      steps: [
        '5.5 + 3.5', // Starting equation
        '9', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [{ // Step 1
          availableChangeTypes: [KEMU_DECIMAL_TO_FRACTION, SIMPLIFY_ARITHMETIC__ADD],
          attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
          from: '5.5 + 3.5',
          to: '9',
        }], // No Step 2
      ]),
    },
    // Add more tests here
  ]
  additionSuccessCases.forEach((test, index) => testStepEvaluation(test, index))
})
describe('addition Mistakes', () => {
  const additionMistakeCases = [
    // Test 1
    {
      description: 'Incorrect addition, added one too many',
      steps: [
        '4 + 3', // Starting equation
        '8', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '4 + 3',
            to: '8',
            attemptedToGetTo: '7',
            mistakenChangeType: ADDED_ONE_TOO_MANY,
            isValid: false,
          },
        ],
      ]),
    },

    // Test 2
    {
      description: 'Incorrect addition, subtracted instead of adding',
      steps: [
        '5 + 2', // Starting equation
        '3', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5 + 2',
            to: '3',
            attemptedToGetTo: '7',
            mistakenChangeType: 'SUBTRACTED_INSTEAD_OF_ADDED',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 3
    {
      description: 'Incorrect addition, added one too few',
      steps: [
        '6 + 4', // Starting equation
        '9', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '6 + 4',
            to: '9',
            attemptedToGetTo: '10',
            mistakenChangeType: 'ADDED_ONE_TOO_FEW',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 4
    {
      description: 'Incorrect addition, multiplied instead of adding',
      steps: [
        '3 + 3', // Starting equation
        '9', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '3 + 3',
            to: '9',
            attemptedToGetTo: '6',
            mistakenChangeType: 'MULTIPLIED_INSTEAD_OF_ADDED',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 5
    {
      description: 'Incorrect addition with decimal numbers',
      steps: [
        '2.5 + 1.5', // Starting equation
        '5', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD, KEMU_DECIMAL_TO_FRACTION],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '2.5 + 1.5',
            to: '5',
            attemptedToGetTo: '4',
            mistakenChangeType: 'ADDED_ONE_TOO_MANY',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 6
    {
      description: 'Incorrect addition with negative numbers',
      steps: [
        '4 + (-2)', // Starting equation
        '3', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '4 + (-2)',
            to: '3',
            attemptedToGetTo: '2',
            mistakenChangeType: 'ADDED_ONE_TOO_MANY',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 7
    {
      description: 'Incorrect addition, incorrectly combined like terms',
      steps: [
        '5a + 3a', // Starting equation
        '7a', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [COLLECT_AND_COMBINE_LIKE_TERMS],
            attemptedChangeType: COLLECT_AND_COMBINE_LIKE_TERMS,
            from: '5a + 3a',
            to: '(5+3)*a',
            attemptedToGetTo: '(5+3)*a',
            mistakenChangeType: null,
            isValid: true,
          },
          {
            availableChangeTypes: [COLLECT_AND_COMBINE_LIKE_TERMS], // TODO not sure why SIMPLIFY_ARITHMETIC__ADD is not also her technically?
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '(5+3)*a',
            to: '7a',
            attemptedToGetTo: '8a',
            mistakenChangeType: 'ADDED_ONE_TOO_FEW',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 8
    {
      description: 'Incorrect addition of multiple terms',
      steps: [
        '2 + 3 + 4', // Starting equation
        '8', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '2 + 3 + 4',
            to: '5 + 4',
            attemptedToGetTo: '5 + 4',
            mistakenChangeType: null,
            isValid: true,
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5 + 4',
            to: '8',
            attemptedToGetTo: '9',
            mistakenChangeType: 'ADDED_ONE_TOO_FEW',
            isValid: false,
          },
        ],
      ]),
    },

    // Test 9
    {
      description: 'Completely Incoherent Addition',
      steps: [
        '2 + 3', // Starting equation
        '200', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: 'UNKNOWN',
            from: '2 + 3',
            to: '200',
            attemptedToGetTo: 'UNKNOWN',
            mistakenChangeType: 'UNKNOWN',
            isValid: false,
          },
        ],
      ]),
    },

  ]
  additionMistakeCases.forEach((test, index) => testStepEvaluation(test, index))
})

describe('multiplication Success', () => {
  const multiplicationSuccessCases = [
    // Test 1
    {
      description: 'Simple Multiplication',
      steps: [
        '4 * 5', // Starting equation
        '20', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '4 * 5',
            to: '20',
          },
        ],
      ]),
    },
    // Test 2
    {
      description: 'Multiplication with zero',
      steps: [
        '7 * 0', // Starting equation
        '0', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [
          {
            availableChangeTypes: [MULTIPLY_BY_ZERO],
            attemptedChangeType: MULTIPLY_BY_ZERO,
            from: '7 * 0',
            to: '0',
          },
        ],
      ]),
    },
    // Test 3
    {
      description: 'Multiplication with negative numbers',
      steps: [
        '-3 * 6', // Starting equation
        '-18', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY/* , SIMPLIFY_SIGNS */], // No SIMPLIFY_SIGNS for some reason
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '-3 * 6',
            to: '-18',
          },
        ],
      ]),
    },
    // Test 4
    {
      description: 'Multiplication of three numbers',
      steps: [
        '2 * 3 * 4', // Starting equation
        '24', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '2 * 3 * 4',
            to: '6 * 4',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            to: '24',
          },
        ],
      ]),
    },
    // Test 5
    {
      description: 'Multiplication with fractions',
      steps: [
        '(1/2) * (3/4)', // Starting equation
        '3/8', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [ // TODO attemped should be in availableChangeTypes as well. 1(3)/2(4) should also multiply be valid?
          {
            availableChangeTypes: [MULTIPLY_FRACTIONS],
            attemptedChangeType: MULTIPLY_FRACTIONS,
            from: '(1/2) * (3/4)',
            to: '(1*3)/(2*4)',
          },
          {
            availableChangeTypes: [MULTIPLY_FRACTIONS],
            attemptedChangeType: REMOVE_MULTIPLYING_BY_ONE,
            to: '3/(2*4)',
          },
          {
            availableChangeTypes: [MULTIPLY_FRACTIONS],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            to: '3/8',
          },
        ],
      ]),
    },
    // Test 6
    {
      description: 'Multiplication with decimals',
      steps: [
        '0.5 * 0.4', // Starting equation
        '0.2', // Step 1 from user
      ],
      expectedStepAnalysis: makeCorrectStepsUtil([
        [
          {
            availableChangeTypes: [KEMU_DECIMAL_TO_FRACTION, SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '0.5 * 0.4',
            to: '0.2',
          },
        ],
      ]),
    },
    // Add more tests here as needed
  ]
  multiplicationSuccessCases.forEach((test, index) => testStepEvaluation(test, index))
})
describe('multiplication Mistakes', () => {
  const multiplicationMistakeCases = [
    // Test 1
    {
      description: 'Incorrect multiplication, multiplied one too many',
      steps: [
        '3 * 4', // Starting equation
        '15', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '3 * 4',
            to: '15',
            attemptedToGetTo: '12',
            mistakenChangeType: MULTIPLIED_ONE_TOO_MANY,
            isValid: false,
          },
        ],
      ]),
    },
    // Test 2
    {
      description: 'Incorrect multiplication, added instead of multiplying',
      steps: [
        '2 * 3', // Starting equation
        '5', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '2 * 3',
            to: '5',
            attemptedToGetTo: '6',
            mistakenChangeType: ADDED_INSTEAD_OF_MULTIPLIED,
            isValid: false,
          },
        ],
      ]),
    },
    // Test 3
    {
      description: 'Incorrect multiplication, multiplied one too few',
      steps: [
        '4 * 2', // Starting equation
        '6', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '4 * 2',
            to: '6',
            attemptedToGetTo: '8',
            mistakenChangeType: ADDED_INSTEAD_OF_MULTIPLIED, // TODO multiple types of mistakes can occur. ADDED_INSTEAD_OF_MULTIPLIED & MULTIPLIED_ONE_TOO_FEW
            isValid: false,
          },
        ],
      ]),
    },
    // Test 4
    {
      description: 'Incorrect multiplication with fractions',
      steps: [
        '1/2 * 2/3', // Starting equation
        '2/9', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            isValid: true,
            reachesOriginalAnswer: true,
            from: '1/2 * 2/3',
            to: '1(2)/2(3)',
            attemptedToGetTo: '1(2)/2(3)',
            attemptedChangeType: MULTIPLY_FRACTIONS,
            mistakenChangeType: null,
            availableChangeTypes: [
              MULTIPLY_FRACTIONS,
              CANCEL_TERMS,
            ],
          },
          {
            isValid: true,
            reachesOriginalAnswer: true,
            from: '1(2)/2(3)',
            to: '2/(2(3))',
            attemptedToGetTo: '2/(2(3))',
            attemptedChangeType: REMOVE_MULTIPLYING_BY_ONE,
            mistakenChangeType: null,
            availableChangeTypes: [
              MULTIPLY_FRACTIONS,
              CANCEL_TERMS,
            ],
          },
          {
            isValid: false,
            reachesOriginalAnswer: false,
            from: '2/(2(3))',
            to: '2/9',
            attemptedToGetTo: '2/6',
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            mistakenChangeType: MULTIPLIED_ONE_TOO_MANY, // TODO could also have been ADDED_INSTEAD_OF_MULTIPLIED
            availableChangeTypes: [
              MULTIPLY_FRACTIONS,
              CANCEL_TERMS,
            ],
          },
        ],
      ]),
    },
    // Test 5
    {
      description: 'Incorrect multiplication with negative numbers',
      steps: [
        '-4 * 2', // Starting equation
        '-6', // Step 1 from user
      ],
      expectedStepAnalysis: ([
        [
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            from: '-4 * 2',
            to: '-6',
            attemptedToGetTo: '-8',
            mistakenChangeType: MULTIPLIED_ONE_TOO_MANY, // TODO could also have been MULTIPLIED_ONE_TOO_FEW
            isValid: false,
          },
        ],
      ]),
    },
    // Add more tests here as needed
  ]
  multiplicationMistakeCases.forEach((test, index) => testStepEvaluation(test, index))
})
