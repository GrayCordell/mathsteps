import { describe, expect, it } from 'vitest'
import mathsteps, { myNodeToString } from '~/index'
import { solveEquation } from '~/indexPrepareSimplifyAndSolve'

import { assessUserSteps } from '~/simplifyExpression/stepEvaluationCore'
import { RANDOM_EXPRESSIONS } from '~/util/randomExpression'
import { cleanString } from '~/util/stringUtils'

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

