import { filterUniqueValues } from '~/util/arrayUtils'
import { LogLevel, logger } from '~/util/logger'
import { cleanString } from '~/util/stringUtils'
import { EqualityCache } from '~/util/equalityCache'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers.js'
import type { AChangeType } from '~/types/ChangeTypes'
import { SIMPLIFY_ARITHMETIC__SUBTRACT, UNKNOWN } from '~/types/ChangeTypes'

import type { AMistakeType } from '~/types/ErrorTypes'
import { NO_CHANGE, convertAdditionToSubtractionErrorType, isAdditionError } from '~/types/ErrorTypes'
import { findAllNextStepOptions } from '~/simplifyExpression/stepEvaluationCoreNextStepOptionsHelper'

export interface RawStep {
  from: string
  to: string[]
  changeType: AMistakeType & AChangeType
  isMistake: boolean // the entire step is a mistake
  mTo?: { to: string, changeType: AMistakeType }[]
}

/**
 * The processed step is the same as the raw step, but the 'to' is a string instead of an array of strings. We flattend it. TODO make a better name for this. IntermediateStep?
 */
export type ProcessedStep = Omit<RawStep, 'to'> & { to: string, availableChangeTypes: (AMistakeType & AChangeType)[] } // to is a string instead of an array of strings. We flattend it.

export type CoreAssessUserStepResult = {
  history: ProcessedStep[]
  isFoundStepAMistake: boolean
  mToStep?: string
  mistakenChangeType: AMistakeType
} | { history: [], isFoundStepAMistake: false }
| { history: ProcessedStep[], isFoundStepAMistake: false }

/**
 * The final step info object that is returned to the user.
 */
export interface StepInfo {
  isValid: boolean // Whether the step is valid from the previous step.
  reachesOriginalAnswer: boolean // Whether the step leads to the original answer of the expression.
  from: string // The expression before the step
  to: string // The expression after the step
  attemptedToGetTo: string // The expression the user attempted to get to
  attemptedChangeType: AChangeType // The type of change the user attempted
  mistakenChangeType: AMistakeType | null // The type of mistake the user made, if any
  availableChangeTypes: AChangeType[] // The types of changes the user could have made
}

const validStepEqCache = new EqualityCache()
export const getValidStepEqCache = () => validStepEqCache
const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, validStepEqCache)

const MAX_STEP_DEPTH = 100
/**
 * Creates a history of steps found from the previous step to get to the user's step. Requires processStepInfo to convert the history into the final StepInfo[] form.
 */
function _coreAssessUserStep(lastTwoUserSteps: string[], firstChangeTypesLog: (AMistakeType & AChangeType)[] = []): CoreAssessUserStepResult {
  const valueToFind = lastTwoUserSteps[1]
  const stepQueue: { start: string, history: ProcessedStep[] }[] = []
  const triedSteps = new Set<string>()

  if (lastTwoUserSteps[0] === lastTwoUserSteps[1])
    return { history: [], isFoundStepAMistake: false }

  stepQueue.push({ start: lastTwoUserSteps[0], history: [] })

  let depth = 0
  while (stepQueue.length > 0 && depth < MAX_STEP_DEPTH) {
    let { start, history } = stepQueue.shift()! // Use shift for BFS (queue)
    start = cleanString(start)

    if (triedSteps.has(start) || Array.from(triedSteps).some(step => expressionEquals(step, start)))
      continue
    triedSteps.add(start)

    logger.deferred('-------------------', LogLevel.DEBUG)
    logger.deferred(`from:${start}, trying to find ${valueToFind}, depth:${depth}`, LogLevel.DEBUG)

    const allPossibleNextStep = findAllNextStepOptions(start)

    if (!allPossibleNextStep || allPossibleNextStep.length === 0)
      continue
    if (depth === 0) { // @ts-expect-error ---
      firstChangeTypesLog.push(allPossibleNextStep.filter(step => !step?.isMistake).map(step => step?.changeType))
    }

    for (const possibleStep of allPossibleNextStep) {
      // Record the step in history
      const updatedHistory = [...history, possibleStep]

      if (!possibleStep.isMistake && expressionEquals(possibleStep.to, valueToFind)) {
        return { history: updatedHistory, isFoundStepAMistake: false }
      }
      for (const mToStep of possibleStep.mTo || []) {
        if (!possibleStep.isMistake && possibleStep.to && mToStep.to === possibleStep.to)
          continue

        if (expressionEquals(mToStep.to, valueToFind)) {
          // The mistake found can be a correct step somehow later. So we have to ignore incorrect steps that can become the answer.
          const isStillCorrect = expressionEquals(getAnswerFromStep(start), getAnswerFromStep(mToStep.to))
          if (isStillCorrect)
            continue
          return { history: updatedHistory, mToStep: mToStep.to, isFoundStepAMistake: true, mistakenChangeType: mToStep.changeType }
        }
      }

      stepQueue.push({ start: possibleStep.to, history: updatedHistory })
    }

    depth++
  }

  return { history: [], isFoundStepAMistake: false }
}

/**
 * @description Fixes the mistakenChangeType if the changeType is SIMPLIFY_ARITHMETIC__SUBTRACT and the mistakenChangeType is an addition error. TODO do this earlier?
 * @param changeType
 * @param mistakenChangeType
 */
function correctChangeTypeSubtractToAddFix(changeType: AChangeType, mistakenChangeType: AMistakeType): AMistakeType {
  return (mistakenChangeType && changeType === SIMPLIFY_ARITHMETIC__SUBTRACT && isAdditionError(mistakenChangeType))
    ? convertAdditionToSubtractionErrorType(mistakenChangeType)
    : mistakenChangeType
}

/**
 * @description Processes CoreAssessUserStepResult into the final StepInfo[] form
 * @param res - The result from _coreAssessUserStep
 * @param previousStep - The previous step before the user's step. ex. '2x + 2x + 2x'
 * @param userStep - The users step moving from the previous step to the current step. ex. '2x + 4x'
 * @param startingStepAnswer - The actual answer of the equation.
 * @param firstChangeTypesLog - The first change types logged from the first step, for unknown and no change cases.
 */
function processStepInfo(
  res: CoreAssessUserStepResult,
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  firstChangeTypesLog: (AMistakeType & AChangeType)[],
): StepInfo[] {
  /// / if somehow the users step.changeType is not in the availableChangeTypes, add it.
  // if (!step.isMistake && !availableChangeTypes.includes(step.changeType))
  //  availableChangeTypes.push(step.changeType)

  const history = res.history
  const isFoundStepAMistake = res.isFoundStepAMistake
  const mistakenChangeType = 'mistakenChangeType' in res ? res.mistakenChangeType : null

  let stepInfo: StepInfo[] = []

  const firstAvailableChangeTypes = filterUniqueValues(firstChangeTypesLog.flat())

  // Handle no history(unknown error type) or the user's step is the same as the starting step(No change).
  if (history.length === 0) {
    const isStartingStepsSame = previousStep === userStep
    const startingFrom = cleanString(previousStep)
    const wentTo = cleanString(userStep)

    const sharedPart = { isValid: false, from: startingFrom, to: wentTo, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: UNKNOWN, mistakenChangeType: null, availableChangeTypes: firstAvailableChangeTypes }
    stepInfo = isStartingStepsSame
      ? [{ ...sharedPart, reachesOriginalAnswer: true, mistakenChangeType: NO_CHANGE }]
      : [{ ...sharedPart, reachesOriginalAnswer: false, mistakenChangeType: UNKNOWN }]
  }
  // Handle the history Path to the MistakeStep or Path to the CorrectStep.
  else {
    stepInfo = history.map((step, index) => {
      const to = cleanString(step.to)
      const attemptedToGetTo = cleanString(step.to)
      const from = history.length === 1 ? cleanString(previousStep) : step.from
      const isLastStep = index === history.length - 1
      const availableChangeTypes = filterUniqueValues(step.availableChangeTypes)
      const attemptedChangeType = step.changeType
      const fixedMistakeType = correctChangeTypeSubtractToAddFix(attemptedChangeType, mistakenChangeType)

      // uses mistakenChangeType if the step is the last mistake.
      if (isLastStep && isFoundStepAMistake) { // Technically we could have a reachesOriginalAnswer check here, but it might generally be unnecessary.
        return { isValid: false, reachesOriginalAnswer: false, from, to: res.mToStep!, attemptedToGetTo, attemptedChangeType, mistakenChangeType: fixedMistakeType, availableChangeTypes }
      }
      // else

      // Handle Valid. Since we have a history and its not a found mistake, then the step is going to just be one of the valid ones. Does not require sameEventualAnswer to be valid.
      const reachesOriginalAnswer = expressionEquals(getAnswerFromStep(step.to), startingStepAnswer)
      return { isValid: true, reachesOriginalAnswer, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: null, availableChangeTypes }
    })
  }

  return stepInfo
}

/**
 *
 * @param previousUserStep - The previous step before the user's step. ex. '2x + 2x + 2x'
 * @param userStep - The users step moving from the previous step to the current step. ex. '2x + 4x'
 * @param startingStepAnswer - The actual answer of the equation. If not provided, it will be calculated using the previous step.
 * @returns {StepInfo[]}
 * @see {StepInfo} for the structure of the returned object.
 * @see {assessUserSteps} for evaluating many steps at once.
 * @example
 * const userSteps = [
 *   '2x + 2x + 2x', // Initial expression
 *   // '4x + 2x' -- Skipped by the user
 *   '6x'            // First user-provided step
 * ]
 * const assessedStep = assessUserStep(userSteps[0], userSteps[1]); // Returns an array of StepInfo[]
 * const skippedSteps = assessedStep.slice(0, stepSequence.length - 1); // All intermediate steps missed ('4x + 2x')
 * const userProvidedStep = assessedStep[stepSequence.length - 1];      // The step provided by the user (6x)
 * if(userProvidedStep.isValid) {
 *  console.log('User provided a valid step!')
 * }
 */
export function assessUserStep(previousUserStep: string, userStep: string, startingStepAnswer: string = getAnswerFromStep(previousUserStep)): StepInfo[] {
  // const userStep = myNodeToString(parseText(userStep_))
  const firstChangeTypesLog: AChangeType[] = []
  const rawAssessedStepOptionsRes = _coreAssessUserStep([previousUserStep, userStep], firstChangeTypesLog)
  return processStepInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, startingStepAnswer, firstChangeTypesLog)
}

/**
 * Evaluates the sequence of steps a user took to simplify an expression and returns a detailed breakdown of each step.
 *
 * @param userSteps - An array of strings representing the steps the user took to simplify the expression, in order.
 * @example
 * const userSteps = [
 *   '2x + 3x', // Initial expression
 *   '5x'       // First step by the user
 * ]
 *
 * @returns An array of StepInfo[][], where each StepInfo[][] represents a detailed sequence of steps leading to each user-provided step.
 * Each StepInfo[] in this array contains the intermediate steps needed to derive the corresponding user step.
 * @see {StepInfo} for the structure of the returned objects.
 *
 * @example
 * const userSteps = [
 *   '2x + 2x + 2x', // Initial expression
 *   // '4x + 2x' -- Skipped by the user
 *   '6x'            // First user-provided step
 * ]
 * const assessedSteps = assessUserSteps(userSteps); // Returns an array of StepInfo[][]
 *
 * for (const stepSequence of assessedSteps) {
 *   const skippedSteps = stepSequence.slice(0, stepSequence.length - 1); // All intermediate steps missed ('4x + 2x')
 *   const userProvidedStep = stepSequence[stepSequence.length - 1];      // The step provided by the user (6x)
 * }
 */
export function assessUserSteps(userSteps: string[]): StepInfo[][] {
  if (userSteps.length === 0)
    return []
  // const userSteps = userSteps_.map(step => myNodeToString(parseText(step)))

  const assessedSteps: StepInfo[][] = []
  let previousStep: string | undefined
  const startingStepAnswer = getAnswerFromStep(userSteps[0])

  for (const userStep of userSteps) {
    // skip starting step. (Its the starting equation)
    if (!previousStep) {
      previousStep = userStep
      continue
    }
    const assessedStep = assessUserStep(previousStep, userStep, startingStepAnswer)
    assessedSteps.push(assessedStep)
    previousStep = userStep
  }

  return assessedSteps
}
