import { describe, it } from 'vitest'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { assessUserSteps } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'

// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore --- I don't know why this needs to be ignored.
import { assertSpecifiedValues } from './util/assertHelpers'

const { CANCEL_TERMS_FOR_FRACTION, COLLECT_AND_COMBINE_LIKE_TERMS, KEMU_DECIMAL_TO_FRACTION, MULTIPLY_BY_ZERO, MULTIPLY_FRACTIONS, REARRANGE_COEFF, REMOVE_ADDING_ZERO, REMOVE_MULTIPLYING_BY_ONE, SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__MULTIPLY, SIMPLIFY_ARITHMETIC__SUBTRACT } = ChangeTypes
const { ADDED_INSTEAD_OF_MULTIPLIED, ADDED_INSTEAD_OF_SUBTRACTED, ADDED_ONE_TOO_MANY, MULTIPLIED_INSTEAD_OF_ADDED, MULTIPLIED_ONE_TOO_MANY, SUBTRACTED_ONE_TOO_FEW, PEMDAS__ADD_INSTEAD_OF_MULTIPLY, SUBTRACTED_ONE_TOO_MANY } = ChangeTypes

const cleanMath = (str: string) => str?.replace('_', '').replace(' ', '').replace('[', '').replace(']', '').replace('\'', '').replace(`"`, '').replace('`', '')
interface Test {
  description: string // Description of the test
  steps: string[] // The steps the user took. ['startingEquation', 'step1', 'step2', ...]
  expectedAnalysis: Partial<StepInfo>[][] // Partial so we don't have to specify all the values for each step.
}

function testStepEvaluation(test: Test, index: number) {
  it(`test ${index + 1}: ${test.description}`, () => {
    let { steps, expectedAnalysis } = test
    steps = steps.map(cleanMath)

    const evaluatedSteps = assessUserSteps(steps)

    for (let i = 0; i < expectedAnalysis.length; i++) {
      const stepsSteps = evaluatedSteps[i] // StepSteps because some steps can be implicit/skipped, but its still 1 users step.
      const expectedStepSteps = expectedAnalysis[i]

      for (let j = 0; j < stepsSteps.length; j++) {
        if (expectedStepSteps.length === j)
          break
        const step = stepsSteps[j]
        const expectedStep = expectedStepSteps[j]
        assertSpecifiedValues(step, expectedStep)
      }
    }
  })
}

function makeCorrectStepUtil(step: Partial<StepInfo>, lastStep: StepInfo['to'] | undefined): Partial<StepInfo> {
  // If no from lets just use the last step as the from.
  if (lastStep && step.from === undefined)
    step.from = cleanMath(lastStep)

  step.from = step.from ? cleanMath(step.from) : undefined
  step.to = step.to ? cleanMath(step.to) : undefined

  function onUndefinedUseDefault<T>(value: T | undefined, defaultValue: T): T {
    return value !== undefined ? value : defaultValue
  }

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
}

/**
 * @description Helper function so we don't have to specify all the values for each step.
 * It will fill in the missing values with defaults.
 * This is helpful because some values are always the same if everything should be correct.
 * availableChangeTypes is required unless disabled with doesNotRequireAvailableChangeTypes.
 */
function makeCorrectSteps(correctStepStepsArr: Partial<StepInfo & { fromTo?: string }>[][], requiresAvailableChangeTypes: boolean = true): Partial<StepInfo>[][] {
  let lastStep: StepInfo['to'] | undefined

  correctStepStepsArr = correctStepStepsArr.map((stepSteps) => {
    return stepSteps.map((step) => {
      step.from = step.from ? cleanMath(step.from) : undefined
      step.to = step.to ? cleanMath(step.to) : undefined
      step.fromTo = step.fromTo ? cleanMath(step.fromTo) : undefined

      if (step.fromTo) {
        step.from = step.fromTo.split('->')[0]
        step.to = step.fromTo.split('->')[1]
      }

      if (requiresAvailableChangeTypes && !step.attemptedChangeType && step.availableChangeTypes && step.availableChangeTypes.length === 1) // for convenience.
        step.attemptedChangeType = step.availableChangeTypes[0]

      if (requiresAvailableChangeTypes && !step.availableChangeTypes)
        throw new Error('availableChangeTypes must be defined and have at least one value. Disable it with doesNotRequireAvailableChangeTypes as false')

      const newCorrectStep = makeCorrectStepUtil(step, lastStep)
      lastStep = step.to
      return newCorrectStep
    })
  })

  return correctStepStepsArr
}

/**
 * @param description The description of the test
 * @param fromToString 'from -> to'
 * @param availableChangeTypes The availableChangeTypes for the step. We use the first as the attemptedChangeType.
 * @param attemptedChangeType
 */
function makeOneCorrectStep(description: string, fromToString: string, availableChangeTypes: AChangeType[], attemptedChangeType?: AChangeType | undefined): Test {
  const from = cleanMath(fromToString.split('->')[0])
  const to = cleanMath(fromToString.split('->')[1])
  if (!attemptedChangeType && availableChangeTypes.length === 1)
    attemptedChangeType = availableChangeTypes[0]
  else if (!attemptedChangeType && availableChangeTypes.length > 1)
    throw new Error('attemptedChangeType must be defined if there are multiple availableChangeTypes')

  return {
    description,
    steps: [from, to],
    expectedAnalysis: [[
      makeCorrectStepUtil({ from, to, availableChangeTypes, attemptedChangeType }, undefined),
    ]],
  }
}

describe('addition Success', () => {
  const additionSuccessCases: Test[] = [
    // Test 1
    makeOneCorrectStep('Simple Addition', '5 + 5 -> 10', [SIMPLIFY_ARITHMETIC__ADD]),
    { // Test 2
      description: 'Simple Addition, 1 implicit skipped step',
      steps: ['5 + 5 + 5', '15'],
      expectedAnalysis: makeCorrectSteps([
        [
          { fromTo: '[5 + 5 + 5] -> [10 + 5]', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] }, // attemptedType is implicit for these 1 step problems.
          { to: '15', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] },
        ],
      ]),
    },
    { // Test 3
      description: 'Simple Addition of three numbers',
      steps: ['3 + 7 + 10', '20'],
      expectedAnalysis: makeCorrectSteps([
        [
          { fromTo: '[3 + 7 + 10] -> [10 + 10]', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] },
          { to: '20', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] },
        ],
      ]),
    },
    { // Test 4
      description: 'Addition with zero',
      steps: ['8 + 0 + 4', '12'],
      expectedAnalysis: makeCorrectSteps([
        [
          { fromTo: '[8 + 0 + 4] -> [8 + 4]', availableChangeTypes: [REMOVE_ADDING_ZERO, SIMPLIFY_ARITHMETIC__ADD, COLLECT_AND_COMBINE_LIKE_TERMS], attemptedChangeType: REMOVE_ADDING_ZERO },
          { to: '12', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] },
        ],
      ]),
    },
    { // Test 5
      description: 'Addition with negative numbers',
      steps: ['5 + (-3) + 2', '4'],
      expectedAnalysis: makeCorrectSteps([
        [
          { fromTo: '5 - 3 + 2 -> 2 + 2', availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT, SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT },
          { fromTo: '2 + 2 -> 4', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD] },
        ],
      ]),
    },
    { // Test 6
      description: 'Addition with multiple terms including negative numbers',
      steps: ['7 + (-2) + 3 + (-1)', '7'],
      expectedAnalysis: makeCorrectSteps([
        [
          { from: '7 + (-2) + 3 + (-1)', to: '5 + 3 + (-1)', availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT, SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT },
          { from: '5 + 3 + (-1)', to: '5 + 2', availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT, SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT },
          { to: '7', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD },
        ],
      ]),
    },
    { // Test 7
      description: 'Addition with large numbers',
      steps: ['500 + 300 + 200', '1000'],
      expectedAnalysis: makeCorrectSteps([
        [
          { from: '500 + 300 + 200', to: '800 + 200', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD },
          { to: '1000', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD },
        ],
      ]),
    },
    // Test 8
    makeOneCorrectStep('Addition with decimal numbers', '5.5 + 3.5 -> 9', [SIMPLIFY_ARITHMETIC__ADD, KEMU_DECIMAL_TO_FRACTION], SIMPLIFY_ARITHMETIC__ADD),
  ]

  additionSuccessCases.forEach(testStepEvaluation)
})

describe('addition Mistakes', () => {
  const additionMistakeCases: Test[] = [
    // Test 1
    {
      description: 'Incorrect addition, added one too many',
      steps: [
        '4 + 3', // Starting equation
        '8', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
        reachesOriginalAnswer: false,
        from: '4 + 3',
        to: '8',
        attemptedToGetTo: '7',
        mistakenChangeType: ADDED_ONE_TOO_MANY,
        isValid: false,
      }]]),
    },

    // Test 2
    {
      description: 'Incorrect addition, subtracted instead of adding',
      steps: [
        '5 + 2', // Starting equation
        '3', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
        from: '5 + 2',
        to: '3',
        attemptedToGetTo: '7',
        mistakenChangeType: 'SUBTRACTED_INSTEAD_OF_ADDED',
        isValid: false,
      }]]),
    },

    // Test 3
    {
      description: 'Incorrect addition, added one too few',
      steps: [
        '6 + 4', // Starting equation
        '9', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
        from: '6 + 4',
        to: '9',
        attemptedToGetTo: '10',
        mistakenChangeType: 'ADDED_ONE_TOO_FEW',
        isValid: false,
      }]]),
    },

    // Test 4
    {
      description: 'Incorrect addition, multiplied instead of adding',
      steps: [
        '3 + 3', // Starting equation
        '9', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
        from: '3 + 3',
        to: '9',
        attemptedToGetTo: '6',
        mistakenChangeType: MULTIPLIED_INSTEAD_OF_ADDED,
        isValid: false,
      }]]),
    },

    // Test 5
    {
      description: 'Incorrect addition with decimal numbers',
      steps: [
        '2.5 + 1.5', // Starting equation
        '5', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD, KEMU_DECIMAL_TO_FRACTION],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
        from: '2.5 + 1.5',
        to: '5',
        attemptedToGetTo: '4',
        mistakenChangeType: 'ADDED_ONE_TOO_MANY',
        isValid: false,
      }]]),
    },

    // Test 6
    { // NOTE: This is handled as "Subtraction" in the system technically. +- is treated as subtraction.
      description: 'Incorrect addition with negative numbers',
      steps: [
        '4 + (-2)', // Starting equation
        '3', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
        from: '4 + (-2)',
        to: '3',
        attemptedToGetTo: '2',
        mistakenChangeType: SUBTRACTED_ONE_TOO_FEW,
        isValid: false,
      }]]),
    },

    // Test 7
    {
      description: 'Incorrect addition, incorrectly combined like terms',
      steps: [
        '5a + 3a', // Starting equation
        '7a', // Step 1 from user
      ],
      expectedAnalysis: ([
        [
          {
            availableChangeTypes: [COLLECT_AND_COMBINE_LIKE_TERMS],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '5a + 3a',
            to: '7a', //  // used to be this -> (5+3)*a which is technically correct. Its still caught alternatively.
            attemptedToGetTo: '8a', // used to be this -> (5+3)*a
            mistakenChangeType: 'UNKNOWN', // TODO should be null
            isValid: false, // used to be true
          },
          /*        {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD,
            from: '(5+3)*a',
            to: '7a',
            attemptedToGetTo: '8a',
            mistakenChangeType: ADDED_ONE_TOO_FEW,
            isValid: false,
          }, */
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
      expectedAnalysis: ([
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
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD],
        attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
        from: '2 + 3',
        to: '200',
        attemptedToGetTo: '5',
        mistakenChangeType: 'UNKNOWN',
        isValid: false,
      }]]),
    },

    { // Test 10
      description: 'Addition with mistake being found by being the only possible availableChangeType',
      steps: ['500 + 300', '600'],
      expectedAnalysis: ([
        [
          { from: '500 + 300', to: '600', availableChangeTypes: [SIMPLIFY_ARITHMETIC__ADD], attemptedChangeType: SIMPLIFY_ARITHMETIC__ADD, isValid: false },
        ],
      ]),
    },

  ]
  additionMistakeCases.forEach((test, index) => testStepEvaluation(test, index))
})

describe('subtraction Success', () => {
  const subtractionSuccessCases: Test[] = [
    // Test 1
    makeOneCorrectStep('Simple Subtraction', '5 - 3 -> 2', [SIMPLIFY_ARITHMETIC__SUBTRACT]),
    // Test 2
    {
      description: 'Simple Subtraction, 1 implicit skipped step',
      steps: [
        '8 - 3 - 2', // Starting equation
        '3', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([
        // Step 1
        [
          { // implicit in step 1, it had to be done to get to the next step.
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
            from: '8 - 3 - 2',
            to: '5 - 2',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
            to: '3',
          },
        ],
        // No Step 2
      ]),
    },

    // Test 3
    {
      description: 'Simple Subtraction of three numbers',
      steps: [
        '10 - 3 - 5', // Starting equation
        '2', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([
        // Step 1
        [
          { // implicit in step 1, it had to be done to get to the next step.
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
            fromTo: '10 - 3 - 5 -> 7 - 5',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
            attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
            to: '2',
          },
        ],
        // No Step 2
      ]),
    },
  ]
  subtractionSuccessCases.forEach((test, index) => testStepEvaluation(test, index))
})
describe('subtraction Mistakes', () => {
  const subtractionMistakeCases: Test[] = [
    // Test 1
    {
      description: 'Incorrect subtraction, subtracted one too many',
      steps: [
        '8 - 4', // Starting equation
        '3', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
        from: '8 - 4',
        to: '3',
        attemptedToGetTo: '4',
        mistakenChangeType: SUBTRACTED_ONE_TOO_MANY,
        isValid: false,
      }]]),
    },
    // Test 2
    {
      description: 'Incorrect subtraction, added instead of subtracting',
      steps: [
        '9 - 3', // Starting equation
        '12', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
        from: '9 - 3',
        to: '12',
        attemptedToGetTo: '6',
        mistakenChangeType: ADDED_INSTEAD_OF_SUBTRACTED,
        isValid: false,
      }]]),
    },

    // Test 3
    {
      description: 'Incorrect subtraction, subtracted one too few',
      steps: [
        '8 - 3', // Starting equation
        '4', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__SUBTRACT],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__SUBTRACT,
        from: '8 - 3',
        to: '4',
        attemptedToGetTo: '5',
        mistakenChangeType: SUBTRACTED_ONE_TOO_MANY,
        isValid: false,
      }]]),
    },
  ]
  subtractionMistakeCases.forEach((test, index) => testStepEvaluation(test, index))
})

describe('multiplication Success', () => {
  const multiplicationSuccessCases: Test[] = [
    // Test 1
    {
      description: 'Simple Multiplication',
      steps: [
        '4 * 5', // Starting equation
        '20', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
        from: '4 * 5',
        to: '20',
      }]]),
    },
    // Test 2
    {
      description: 'Multiplication with zero',
      steps: [
        '7 * 0', // Starting equation
        '0', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([[{
        availableChangeTypes: [MULTIPLY_BY_ZERO],
        attemptedChangeType: MULTIPLY_BY_ZERO,
        from: '7 * 0',
        to: '0',
      }]]),
    },
    // Test 3
    {
      description: 'Multiplication with negative numbers',
      steps: [
        '-3 * 6', // Starting equation
        '-18', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY/* , SIMPLIFY_SIGNS */], // No SIMPLIFY_SIGNS for some reason
        attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
        from: '-3 * 6',
        to: '-18',
      }]]),
    },
    // Test 4
    {
      description: 'Multiplication of three numbers',
      steps: [
        '2 * 3 * 4', // Starting equation
        '24', // Step 1 from user
      ],
      expectedAnalysis: makeCorrectSteps([
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
      expectedAnalysis: makeCorrectSteps([
        [
          {
            availableChangeTypes: [MULTIPLY_FRACTIONS, REARRANGE_COEFF],
            attemptedChangeType: MULTIPLY_FRACTIONS,
            from: '(1/2) * (3/4)',
            to: '(1*3)/(2*4)',
          },
          {
            availableChangeTypes: [REMOVE_MULTIPLYING_BY_ONE, SIMPLIFY_ARITHMETIC__MULTIPLY],
            attemptedChangeType: REMOVE_MULTIPLYING_BY_ONE,
            to: '3/(2*4)',
          },
          {
            availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
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
      expectedAnalysis: makeCorrectSteps([[{
        availableChangeTypes: [KEMU_DECIMAL_TO_FRACTION, SIMPLIFY_ARITHMETIC__MULTIPLY],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
        from: '0.5 * 0.4',
        to: '0.2',
      }]]),
    },
    // Add more tests here as needed
  ]
  multiplicationSuccessCases.forEach((test, index) => testStepEvaluation(test, index))
})
describe('multiplication Mistakes', () => {
  const multiplicationMistakeCases: Test[] = [
    // Test 1
    {
      description: 'Incorrect multiplication, multiplied one too many',
      steps: [
        '3 * 4', // Starting equation
        '15', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
        attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
        from: '3 * 4',
        to: '15',
        attemptedToGetTo: '12',
        mistakenChangeType: MULTIPLIED_ONE_TOO_MANY,
        isValid: false,
      }]]),
    },
    // Test 2
    {
      description: 'Incorrect multiplication, added instead of multiplying',
      steps: [
        '2 * 3', // Starting equation
        '5', // Step 1 from user
      ],
      expectedAnalysis: ([[
        {
          availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
          attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
          from: '2 * 3',
          to: '5',
          attemptedToGetTo: '6',
          mistakenChangeType: ADDED_INSTEAD_OF_MULTIPLIED,
          isValid: false,
        },
      ]]),
    },
    // Test 3
    {
      description: 'Incorrect multiplication, multiplied one too few',
      steps: [
        '4 * 2', // Starting equation
        '6', // Step 1 from user
      ],
      expectedAnalysis: ([[
        {
          availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
          attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
          from: '4 * 2',
          to: '6',
          attemptedToGetTo: '8',
          mistakenChangeType: ADDED_INSTEAD_OF_MULTIPLIED, // TODO multiple types of mistakes can occur. ADDED_INSTEAD_OF_MULTIPLIED & MULTIPLIED_ONE_TOO_FEW
          isValid: false,
        },
      ]]),
    },
    // Test 4
    {
      description: 'Incorrect multiplication with fractions',
      steps: [
        '(1/2) * (2/3)', // Starting equation
        '(1*2)/(2*3)', // Step 1 from user
        '2/(2*3)', // Step 2 from user
        '2/9', // step 3, INCORRECT MULTIPLICATION FROM USER
      ],
      expectedAnalysis: ([
        [{
          isValid: true,
          reachesOriginalAnswer: true,
          from: '(1/2) * (2/3)',
          to: '(1*2)/(2*3)',
          attemptedChangeType: MULTIPLY_FRACTIONS,
          availableChangeTypes: [
            MULTIPLY_FRACTIONS,
            CANCEL_TERMS_FOR_FRACTION,
            REARRANGE_COEFF,
          ],
        }],

        [{
          isValid: true,
          reachesOriginalAnswer: true,
          from: '(1*2)/(2*3)',
          to: '2/(2*3)',
        }],
        [{
          isValid: false,
          reachesOriginalAnswer: false,
          from: '2/(2*3)',
          to: '2/9',
          attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
          mistakenChangeType: MULTIPLIED_ONE_TOO_MANY,
        }],
      ]),
    },
    // Test 5
    {
      description: 'Incorrect multiplication with negative numbers',
      steps: [
        '-4 * 2', // Starting equation
        '-6', // Step 1 from user
      ],
      expectedAnalysis: ([[
        {
          availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
          attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
          from: '-4 * 2',
          to: '-6',
          attemptedToGetTo: '-8',
          mistakenChangeType: MULTIPLIED_ONE_TOO_MANY, // TODO could also have been MULTIPLIED_ONE_TOO_FEW
          isValid: false,
        },
      ]]),
    },
    // Test 6
    {
      description: 'Completely Incoherent Multiplication',
      steps: [
        '2 * 3', // Starting equation
        '200', // Step 1 from user
      ],
      expectedAnalysis: ([[{
        availableChangeTypes: [SIMPLIFY_ARITHMETIC__MULTIPLY],
        attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
        from: '2 * 3',
        to: '200',
        attemptedToGetTo: '6',
        mistakenChangeType: 'UNKNOWN',
        isValid: false,
      }]]),
    },
  ]
  multiplicationMistakeCases.forEach((test, index) => testStepEvaluation(test, index))
})

describe('random issues i\'ve had in the past', () => {
  const randomIssues: Test[] = [
    // Test 1
    {
      description: 'Addition with multiple terms including negative numbers',
      steps: ['10 - 2 * (4 + 3)', '10 - 10'],
      expectedAnalysis: [
        [
          { // implicit in step 1, it had to be done to get to the next step.
            attemptedChangeType: 'KEMU_DISTRIBUTE_MUL_OVER_ADD',
            to: '10 - (2 * 4 + 2 * 3)',
          },
          {
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            to: '10 - (2 * 4 + 6)',
          },
          {
            attemptedChangeType: PEMDAS__ADD_INSTEAD_OF_MULTIPLY,
            to: '10 - (2 * 10)',
            isValid: false,
            reachesOriginalAnswer: false,
            attemptedToGetTo: 'UNKNOWN',
            mistakenChangeType: PEMDAS__ADD_INSTEAD_OF_MULTIPLY,
          },
          {
            attemptedChangeType: SIMPLIFY_ARITHMETIC__MULTIPLY,
            to: '10 - 10',
            attemptedToGetTo: '10 - 20',
            isValid: false,
            mistakenChangeType: 'MULTIPLIED_ONE_TOO_FEW',
          },
        ],
      ],
    },
    // Test 2
    {
      description: 'Reaches original answer but is invalid',
      steps: ['8 + 2', '12 - 2'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            from: '8 + 2',
            to: '12 - 2',
            isValid: false,
            reachesOriginalAnswer: true,
          },
        ],
      ],
    },
    // Test 3
    {
      description: 'very wrong addition',
      steps: ['5 + 5 + 6', '5 + 15'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__ADD',
            from: '5 + 5 + 6',
            to: '5 + 15',
            isValid: false,
            mistakenChangeType: 'UNKNOWN',
            reachesOriginalAnswer: false,
          },
        ],
      ],
    },
    // Test 3
    {
      description: 'very wrong subtraction',
      steps: ['5 + 5 - 6', '5 + 15'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
            from: '5 + 5 - 6',
            to: '5 + 15',
            isValid: false,
            mistakenChangeType: 'UNKNOWN',
            reachesOriginalAnswer: false,
          },
        ],
      ],
    },
    // Test 4
    {
      description: 'very wrong subtraction',
      steps: ['5 + 5 - 6', '5 + 15'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
            from: '5 + 5 - 6',
            to: '5 + 15',
            isValid: false,
            mistakenChangeType: 'UNKNOWN',
          },
        ],
      ],
    },
    // Test 5
    {
      description: 'very wrong division',
      steps: ['5 + 5/2', '5 + 4'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__DIVIDE',
            from: '5 + 5/2',
            to: '5 + 4',
            isValid: false,
            mistakenChangeType: 'UNKNOWN',
          },
        ],
      ],
    },
    // Test 6
    {
      description: 'very wrong multiplication',
      steps: ['5 + 5*2', '5 + 30'],
      expectedAnalysis: [
        [
          {
            attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
            from: '5 + 5*2',
            to: '5 + 30',
            isValid: false,
            mistakenChangeType: 'UNKNOWN',
          },
        ],
      ],
    },

    // Test 7
    { // TODO fix
      description: 't',
      steps: ['10 - 7x + 4 * 3x', '22 + 4 * 3x'],
      expectedAnalysis: [
        [{
          attemptedChangeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
          attemptedToGetTo: '-7x+10+4*3x', // TODO fix
          from: '10 - 7x + 4 * 3x',
          to: '22 + 4 * 3x',
          isValid: false,
          mistakenChangeType: 'UNKNOWN',
        }],
      ],
    },
    // Test 8
    {
      description: 't2',
      steps: ['(8 * 5) - 6 + 4', '30 - 6 + 4'],
      expectedAnalysis: [
        [{
          attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
          attemptedToGetTo: '40+-6+4',
          from: '(8 * 5) - 6 + 4',
          to: '30 - 6 + 4',
          isValid: false,
          mistakenChangeType: 'UNKNOWN',
          reachesOriginalAnswer: false,
        }],
      ],
    },

    // Test 10
    {
      description: 't3',
      steps: ['8+4*2-7', '2x + 3'],
      expectedAnalysis: [
        [{
          attemptedChangeType: 'UNKNOWN',
          attemptedToGetTo: 'UNKNOWN',
          from: '8+4*2-7',
          to: '2x + 3',
          isValid: false,
          reachesOriginalAnswer: false,
          mistakenChangeType: 'UNKNOWN',
        }],
      ],
    },
    // Test 11
    {
      description: '11. ',
      steps: ['(7 + 5) * 2 - 6', '(14 + 7) - 6'],
      expectedAnalysis: [
        [{
          attemptedChangeType: 'KEMU_DISTRIBUTE_MUL_OVER_ADD',
          attemptedToGetTo: '7 * 2 + 5 * 2 +- 6',
          from: '(7 + 5) * 2 - 6',
          to: '7 * 2 + 5 * 2 +- 6',
          isValid: true,
          reachesOriginalAnswer: true,
        }, {
          attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
          attemptedToGetTo: '14 + 5 * 2 +-6 ',
          from: '7 * 2 + 5 * 2 +- 6',
          to: '14 + 5 * 2 +- 6',
          isValid: true,
          reachesOriginalAnswer: true,
        }, {
          attemptedChangeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
          attemptedToGetTo: '14 + 10 +- 6',
          from: '14 + 5 * 2 +- 6',
          to: '14 + 7 - 6',
          isValid: false,
          reachesOriginalAnswer: false,
          mistakenChangeType: 'ADDED_INSTEAD_OF_MULTIPLIED',
        }],
      ],
    },
  ]
  randomIssues.forEach((test, index) => testStepEvaluation(test, index))
})
