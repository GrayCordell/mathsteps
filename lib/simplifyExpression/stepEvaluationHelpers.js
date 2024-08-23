// @ts-check
import mathsteps from '~/index'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization.js'
import { cleanString } from '~/util/stringUtils.js'
import { EqualityCache } from '~/util/equalityCache.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'

const nextStepEqCache = new EqualityCache()

/** @type {{ [step: string]: string}} */
const ansStepCache = {}

/**
 * @param {string} userStep
 * @returns {string}
 */
export function getAnswerFromStep(userStep) {
  userStep = cleanString(userStep)
  // Find if there's an equivalent cached result
  for (const cachedStep of Object.keys(ansStepCache)) {
    if (areExpressionEqual(cachedStep, userStep, nextStepEqCache))
      return ansStepCache[cachedStep]
  }

  /** @type {import('mathjs').MathNode} */
  const eventualAnswer = mathsteps.simplifyExpression({
    expressionAsText: userStep,
    // @ts-expect-error ---
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    isDryRun: false,
    isWithAlternativeRun: false,
    getAllNextStepPossibilities: false,
    // onStepCb: (step) => {
    // },
  })

  const strEventualAnswer = myNodeToString(eventualAnswer)
  ansStepCache[userStep] = strEventualAnswer
  return strEventualAnswer
}
