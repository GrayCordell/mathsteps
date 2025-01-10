import { describe, expect, it } from 'vitest'
import mathsteps, { myNodeToString } from '~/index'

import { assessUserSteps } from '~/simplifyExpression/stepEvaluationCore'
import { RANDOM_EXPRESSIONS } from '~/util/randomExpression'
import { cleanString } from '~/util/stringUtils'

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

