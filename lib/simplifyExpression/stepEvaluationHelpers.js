// @ts-check
import mathsteps from '~/index'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { EqualityCache } from '~/util/equalityCache'
import { cleanString } from '~/util/stringUtils.js'

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


/**
 * @param {string} equation
 * @param {string|null} [variable]
 */
export function getAnswerFromEquation(equation, variable = null) {
  variable = variable || equation.match(/[a-z]/i)?.[0] || 'x'

  const result = mathsteps.solveEquation({
    equationAsText: equation,
    unknownVariable: variable,
    /// **
    // * @param {{ equation: { getId: () => any; }; stepId: string; }} step
    // */
    // onStepCb(step) {
    //  console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
    // },
  })
  return result.getSolutionsAsText()
}
