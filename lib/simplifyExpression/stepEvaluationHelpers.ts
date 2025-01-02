import type { MathNode } from 'mathjs'
import mathsteps from '~/index'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { EqualityCache } from '~/util/equalityCache'
import { cleanString } from '~/util/stringUtils.js'

const nextStepEqCache = new EqualityCache()

const ansStepCache: { [step: string]: string } = {}

/**
 * @param {string} userStep
 * @returns {string}
 */
export function getAnswerFromStep(userStep: string): string {
  userStep = cleanString(userStep)
  // Find if there's an equivalent cached result
  for (const cachedStep of Object.keys(ansStepCache)) {
    if (areExpressionEqual(cachedStep, userStep, nextStepEqCache))
      return ansStepCache[cachedStep]
  }

  const eventualAnswer: MathNode = mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    getAllNextStepPossibilities: false,
    // onStepCb: (step) => {
    // },
  })

  const strEventualAnswer = myNodeToString(eventualAnswer)
  ansStepCache[userStep] = strEventualAnswer
  return strEventualAnswer
}


/**
 * @param {string} userStep
 * @returns {MathNode}
 */
export function getAnswerFromStepAsNode(userStep: string): MathNode {
  userStep = cleanString(userStep)
  return mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    getAllNextStepPossibilities: false,
    // onStepCb: (step) => {
    // },
  })
}


/**
 * @param {string} equation
 * @param {string|null} [variable]
 */
export function getAnswerFromEquation(equation: string, variable: string | null = null): string {
  const useThisVariable: string = variable || equation.match(/[a-z]/i)?.[0] || 'x'

  const result = mathsteps.solveEquation({
    equationAsText: equation,
    unknownVariable: useThisVariable,
    /// **
    // * @param {{ equation: { getId: () => any; }; stepId: string; }} step
    // */
    // onStepCb(step) {
    //  console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
    // },
  })
  return result.getSolutionsAsText()
}
