import type { ProcessedStep, RawStep } from '~/simplifyExpression/stepEvaluationCore'
import { getValidStepEqCache } from '~/simplifyExpression/stepEvaluationCore'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { filterUniqueValues } from '~/util/arrayUtils'
import { cleanString } from '~/util/stringUtils'
import { mistakeSearches } from '~/simplifyExpression/mistakes/regexPemdasMistakes'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import mathsteps, { parseText } from '~/index'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'

const { SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__SUBTRACT } = ChangeTypes

let cache: ReturnType<typeof getValidStepEqCache> | null = null
const expressionEquals = (exp0: string, exp1: string): boolean => {
  cache = cache || getValidStepEqCache()
  return areExpressionEqual(exp0, exp1, cache)
}

// Utility function to clean and normalize strings for comparison
function _normalizeExpressionForCountingSubtractions(expr: string) {
  return expr
    .replace(/\+-/g, '-') // Replace +- with -
    .replace(/-\+/g, '-') // Replace -+ with -
    .replace(/--/g, '+') // Replace -- with +
    .replace(/^-/, '') // Remove leading minus for counting purposes. This is so that it doesn't count as a subtraction.
}

/**
 * @description Mathstep rules handle subtraction as + -. To handle this, we need to check if SIMPLIFY_ARITHMETIC__ADD is being used to simplify a +- expression. The trick/hack used here is to count the number of SUBTRACTIONS(not negative) in the expression. If the number of subtractions in the 'to' expression is less than the number of subtractions in the 'from' expression, then we can assume that the SIMPLIFY_ARITHMETIC__ADD is actually a subtraction. This is because the SIMPLIFY_ARITHMETIC__ADD rule is used to simplify a +- expression to a - expression. If the number of subtractions in the 'to' expression is less than the number of subtractions in the 'from' expression, then the SIMPLIFY_ARITHMETIC__ADD rule is being used incorrectly.
 *  There could still be edge cases I am not considering at the moment, but this *should* cover most cases.
 * @example (from:5 + -3, to:2) -> (from:5 - 3, to:2) = (changed subtractions == 1) => SIMPLIFY_ARITHMETIC__ADD becomes SIMPLIFY_ARITHMETIC__SUBTRACT
 * @param steps
 */
function _correctSimplifyAdditionToSubtraction(steps: ProcessedStep[]) {
  steps.forEach((step) => {
    if (step.changeType === SIMPLIFY_ARITHMETIC__ADD && step.from.includes('-')) {
      const fromRaw = _normalizeExpressionForCountingSubtractions(step.from) // changes -- to +, and changes +- to -. Also gets rid of leading minus so that it doesn't count as a subtraction.
      const toRaw = _normalizeExpressionForCountingSubtractions(step.to)

      const fromMinusCount = [...fromRaw.matchAll(/-/g)].length
      const toMinusCount = [...toRaw.matchAll(/-/g)].length
      if (toMinusCount < fromMinusCount) {
        step.changeType = SIMPLIFY_ARITHMETIC__SUBTRACT
      }
    }
  })
  const newAvailableChangeTypes = steps.filter(step => !step?.isMistake).map(step => step?.changeType)
  steps.forEach((step) => {
    step.availableChangeTypes = newAvailableChangeTypes
  })
}

/**
 * @description Converts the raw steps('to' are an array) to processed steps('to' is a string). Also removes all duplicates.
 * @param steps "Raw" steps handed back from simplifyExpression
 */
function _convertRawStepsToProcessedStep(steps: RawStep[]): ProcessedStep[] {
  const availableChangeTypes = filterUniqueValues(steps.filter(step => !step?.isMistake).map(step => step?.changeType))

  const processedStepsSet = new Set<string>()
  return steps
    .filter(step => step.to)
    .flatMap(step => step.to.map(toStr => ({
      ...step,
      availableChangeTypes,
      to: cleanString(toStr),
      from: cleanString(step.from),
    })))
    .filter(step => !processedStepsSet.has(step.to) && processedStepsSet.add(step.to))
    .filter(step => step.to !== step.from)
}
function _addAllAvailbleChangeTypesToEachStep(steps: ProcessedStep[]) {
  const availableChangeTypes = steps.filter(step => !step?.isMistake).map(step => step?.changeType)
  steps.forEach((step) => {
    step.availableChangeTypes = availableChangeTypes
  })
}

/**
 * @description Finds all possible next steps for a given user step. This includes steps from the simplifyExpression engine, as well as additional steps that are not caught/placed yet in the simplifyExpression engine. This is an internal procedure and should not be used directly.
 * @param userStep_ The user's step as a string
 */
export function findAllNextStepOptions(userStep_: string): ProcessedStep[] {
  const userStep = myNodeToString(parseText(userStep_))
  const potentialSteps: RawStep[] = []
  mathsteps.simplifyExpression({
    expressionAsText: userStep,
    // @ts-expect-error ---
    isDebugMode: false,
    isDryRun: true,
    getMistakes: true,
    isWithAlternativeRun: true,
    getAllNextStepPossibilities: true,
    onStepCb: (step: RawStep) => potentialSteps.push(step),
  })

  // Convert the raw steps to processed steps, and remove equal 'to' steps.
  const processedSteps = filterUniqueValues(_convertRawStepsToProcessedStep(potentialSteps), (itemA, itemB) => expressionEquals(itemA.to, itemB.to))

  //
  //  Add Additional Steps
  //

  // +Mistake Steps that ares not caught by the simplification engine.
  const manualMistakes = mistakeSearches(userStep)
  processedSteps.push(...manualMistakes)
  // ... Add additional steps from other simplification/error engines here if needed

  //
  // Cleanup and Fixes
  //

  // availableChangeTypes should be the same for all steps
  _addAllAvailbleChangeTypesToEachStep(processedSteps)
  // Correct SIMPLIFY_ARITHMETIC__ADD to SIMPLIFY_ARITHMETIC__SUBTRACT if needed
  _correctSimplifyAdditionToSubtraction(processedSteps)

  return processedSteps
}
