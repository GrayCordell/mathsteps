import { describe, expect, it } from 'vitest'
import mathsteps, { myNodeToString, parseText } from '~/index'
import { solveEquation } from '~/indexPrepareSimplifyAndSolve'

import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { assessUserSteps } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import { RANDOM_EXPRESSIONS } from '~/util/randomExpression'
import { cleanString } from '~/util/stringUtils'
// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore --- I don't know why this needs to be ignored.
import { assertSpecifiedValues } from './util/assertHelpers'

const { CANCEL_TERMS, COLLECT_AND_COMBINE_LIKE_TERMS, KEMU_DECIMAL_TO_FRACTION, MULTIPLY_BY_ZERO, MULTIPLY_FRACTIONS, REARRANGE_COEFF, REMOVE_ADDING_ZERO, REMOVE_MULTIPLYING_BY_ONE, SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__MULTIPLY, SIMPLIFY_ARITHMETIC__SUBTRACT } = ChangeTypes
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
export function getNodeStepsToSolveEquation(equation: string): {
  equation: {
    left: { type: string, node: any }
    right: { type: string, node: any }
  }
  equationString: string
}[] {
  const equationSteps: any[] = []
  const unknownVariable = equation.toLowerCase().match(/[a-z]/i)?.[0] ?? 'x'
  /* const eventualAnswer = */ solveEquation({
    equationAsText: equation,
    unknownVariable,
    onStepCb(step: any) {
      equationSteps.push({ ...step, equationString: step.equation.toString() })
      // console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
    },
  })
  // console.log('equationSteps', equationSteps)
  return equationSteps
}
export function getNodeStepsToSolveExpression(userStep: string) {
  userStep = cleanString(userStep)
  const steps: any[] = []

  /* const eventualAnswer = */ mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    getAllNextStepPossibilities: false,
    onStepCb: (step: any) => {
      // console.log(stepMeta.changeType, '|', mathsteps.print(stepMeta.rootNode))
      steps.push(step)
    },
  })
  return steps
}

describe('evaluateSteps2', () => {
  for (const problem of RANDOM_EXPRESSIONS) {
    const temp1 = parseText(problem)
    const temp2 = myNodeToString(temp1)
    console.log(temp1, temp2)
    const steps = getNodeStepsToSolveExpression((((problem))))
    const stepsAsText = steps.map(step => myNodeToString(step)) as string[]
    const assessedSolvedProblem = assessUserSteps(stepsAsText)
    it(`evaluateSteps2: ${problem}`, () => {
      // Perform assertions
      expect(assessedSolvedProblem.every(step => step.every((subStep) => {
        const isNoChangeType = subStep.attemptedChangeType === 'NO_CHANGE'
        if (!isNoChangeType && !subStep.isValid) {
          console.error(`Failure:`, subStep)
        }
        return isNoChangeType || (subStep.isValid && subStep.reachesOriginalAnswer)
      }))).toBeTruthy()
    })
  }
})

