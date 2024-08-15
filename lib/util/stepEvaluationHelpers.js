import mathsteps from '~/index.js'
import { areExpressionEqual } from '~/util/expressionEqualsAndNormalization.js'
import { cleanString } from '~/util/mscStringUtils.js'
import { EqualityCache } from '~/util/equalityCache.js'

/**
 * @param userStep {string}
 * @returns {string}
 */
const nextStepEqCache = new EqualityCache()
const ansStepCache = {}
export function getAnswerFromStep(userStep) {
  userStep = cleanString(userStep)
  // Find if there's an equivalent cached result
  for (const cachedStep of Object.keys(ansStepCache)) {
    if (areExpressionEqual(cachedStep, userStep, nextStepEqCache))
      return ansStepCache[cachedStep]
  }

  const eventualAnswer = mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    isDryRun: false,
    isWithAlternativeRun: false,
    getAllNextStepPossibilities: false,
    // onStepCb: (step) => {
    // },
  })
  ansStepCache[userStep] = eventualAnswer
  return eventualAnswer
}
