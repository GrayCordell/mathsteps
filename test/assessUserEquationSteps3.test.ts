import { describe, expect, it } from 'vitest'
import { solveEquation } from '~/index'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType, AEquationChangeType } from '~/types/changeType/ChangeTypes'
import { RANDOM_ALGEBRA_EQUATIONS } from '~/util/randomEquations'
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
  console.log('equationSteps', equationSteps)
  return equationSteps
}


describe('assessUserEquationStep3', () => {
  console.log('starting')
  const assessSolvedProblem = (problem: string) => {
    const steps = getNodeStepsToSolveEquation(problem)
    const stepsAsText = steps.map(step => step.equationString)
    return assessUserEquationSteps(stepsAsText)
  }

  for (const problem of RANDOM_ALGEBRA_EQUATIONS) {
    const assessedSolvedProblem = assessSolvedProblem(problem)
    const left = assessedSolvedProblem.map(step => step.left)
    const right = assessedSolvedProblem.map(step => step.right)

    it(`assessUserEquationSteps3: ${problem}`, () => {
      const leftResults = left.map((step, stepIndex) =>
        step.map((subStep, subStepIndex) => {
          const isValid = subStep.isValid || subStep.attemptedChangeType === 'NO_CHANGE'
          if (!isValid) {
            console.error(`Left side failure at step ${stepIndex}, subStep ${subStepIndex}:`, subStep)
          }
          return isValid
        }),
      )
      const rightResults = right.map((step, stepIndex) =>
        step.map((subStep, subStepIndex) => {
          const isValid = subStep.isValid || subStep.attemptedChangeType === 'NO_CHANGE'
          if (!isValid) {
            console.error(`Right side failure at step ${stepIndex}, subStep ${subStepIndex}:`, subStep)
          }
          return isValid
        }),
      )

      // Perform assertions
      expect(leftResults.every(step => step.every(isValid => isValid))).toBeTruthy()
      expect(rightResults.every(step => step.every(isValid => isValid))).toBeTruthy()
    })
  }
})

