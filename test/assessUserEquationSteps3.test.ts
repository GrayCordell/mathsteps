import { describe, expect, it } from 'vitest'
import { getNodeStepsToSolveEquation } from '~/kemuEquation/SimpleSolveEquationFunction'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import { RANDOM_ALGEBRA_EQUATIONS } from '~/util/randomEquations'

describe('assessUserEquationStep3', () => {
  // console.log('starting')
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
      if (!leftResults.every(step => step.every(isValid => isValid)) || !rightResults.every(step => step.every(isValid => isValid))) {
        console.error('LEFT RESULTS:', leftResults)
        console.error('RIGHT RESULTS:', rightResults)
      }

      // Perform assertions
      expect(leftResults.every(step => step.every(isValid => isValid))).toBeTruthy()
      expect(rightResults.every(step => step.every(isValid => isValid))).toBeTruthy()
    })
  }
})

