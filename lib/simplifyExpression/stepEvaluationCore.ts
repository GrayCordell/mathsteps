import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { findAllNextStepOptions } from '~/simplifyExpression/stepEvaluationCoreNextStepOptionsHelper'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers.js'
import { convertAdditionToSubtractionErrorType, isAnAdditionChangeType } from '~/types/changeType/changeAndMistakeUtils'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { filterUniqueValues } from '~/util/arrayUtils'
import { EqualityCache } from '~/util/equalityCache'
import { logger, LogLevel } from '~/util/logger'
import { cleanString } from '~/util/stringUtils'

export interface RawStep {
  from: string
  to: string[]
  changeType: AChangeType
  isMistake: boolean // the entire step is a mistake
  mTo?: { to: string, changeType: AChangeType }[]
}


/**
 * The processed step is the same as the raw step, but the 'to' is a string instead of an array of strings. We flattened it. TODO make a better name for this. IntermediateStep?
 */
export type ProcessedStep = Omit<RawStep, 'to'> & {
  to: string
  availableChangeTypes: AChangeType[]
  attemptedToGetTo?: string
  attemptedChangeType?: AChangeType
  allPossibleCorrectTos?: string[]
} // to is a string instead of an array of strings. We flattened it.

export type CoreAssessUserStepResult = {
  history: ProcessedStep[]
} | { history: [] }

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
  mistakenChangeType: AChangeType | null // The type of mistake the user made, if any
  availableChangeTypes: AChangeType[] // The types of changes the user could have made
  allPossibleCorrectTos?: string[] // All possible correct steps the user could have made
}

const validStepEqCache = new EqualityCache()
export const getValidStepEqCache = () => validStepEqCache
const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, validStepEqCache)

const MAX_STEP_DEPTH = 100
/**
 * Creates a history of steps found from the previous step to get to the user's step. Requires processStepInfo to convert the history into the final StepInfo[] form.
 */
function _coreAssessUserStep(lastTwoUserSteps: string[], firstChangeTypesLog: (AChangeType)[] = [], firstFoundToLog: string[] = []): CoreAssessUserStepResult {
  const valueToFind = lastTwoUserSteps[1]
  const stepQueue: { start: string, history: ProcessedStep[] }[] = []
  const triedSteps = new Set<string>()

  if (lastTwoUserSteps[0] === lastTwoUserSteps[1])
    return { history: [] }

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

    if (allPossibleNextStep.length === 0)
      continue

    const allPossibleCorrectTos = allPossibleNextStep.filter(step => !step.isMistake).map(step => step.to)
    if (depth === 0) {
      firstChangeTypesLog.push(...allPossibleNextStep.filter(step => !step?.isMistake).map(step => step?.changeType))
      firstFoundToLog.push(...allPossibleCorrectTos)
    }
    for (const possibleStep of allPossibleNextStep) {
      // kind of wasteful but i need to attach the possibleCorrectTos to the step.
      possibleStep.allPossibleCorrectTos = allPossibleCorrectTos

      // Record the step in history
      const updatedHistory = [...history, possibleStep]


      // This handles normal step checks
      if (!possibleStep.isMistake && expressionEquals(possibleStep.to, valueToFind)) {
        return { history: updatedHistory }
      }
      // Handles steps that are marked isMistake=true.
      else if (possibleStep.isMistake && expressionEquals(possibleStep.to, valueToFind)) {
        // The mistake found can be a correct step somehow later. So we have to ignore incorrect steps that can become the answer.
        const isStillCorrect = expressionEquals(getAnswerFromStep(start), getAnswerFromStep(possibleStep.to))
        if (!isStillCorrect)
          return { history: updatedHistory }
      }


      // Handle/check attached alternate mistake options. "mTo". (These are mistakes like added 1 too many, etc.)
      for (const mToStep of possibleStep.mTo || []) {
        if (possibleStep.to && mToStep.to === possibleStep.to)
          continue

        if (expressionEquals(mToStep.to, valueToFind)) {
          // The mistake found can be a correct step somehow later. So we have to ignore incorrect steps that can become the answer.
          const isStillCorrect = expressionEquals(getAnswerFromStep(start), getAnswerFromStep(mToStep.to))
          if (isStillCorrect)
            continue
          // If the mistake is the answer, then we need to add remove the last step in the history
          updatedHistory.pop()
          // add the mistake step to the history
          updatedHistory.push({ ...mToStep, ...possibleStep, from: possibleStep.from, to: mToStep.to, attemptedToGetTo: possibleStep.to, attemptedChangeType: possibleStep.changeType, changeType: mToStep.changeType, isMistake: true })
          return { history: updatedHistory }
        }
      }

      stepQueue.push({ start: possibleStep.to, history: updatedHistory })
    }

    depth++
  }

  return { history: [] }
}
/**
 * @description Fixes the mistakenChangeType if the changeType is SIMPLIFY_ARITHMETIC__SUBTRACT and the mistakenChangeType is an addition error. TODO do this earlier?
 * @param changeType
 * @param mistakenChangeType
 */
function correctChangeTypeSubtractToAddFix<T extends (AChangeType | undefined | null)>(changeType: AChangeType | null, mistakenChangeType?: T): T {
  return ((mistakenChangeType && changeType) && changeType === 'SIMPLIFY_ARITHMETIC__SUBTRACT' && isAnAdditionChangeType(mistakenChangeType))
    ? convertAdditionToSubtractionErrorType(mistakenChangeType) as T
    : mistakenChangeType as T
}

/**
 * @description Processes CoreAssessUserStepResult into the final StepInfo[] form
 * @param res - The result from _coreAssessUserStep
 * @param previousStep - The previous step before the user's step. ex. '2x + 2x + 2x'
 * @param userStep - The users step moving from the previous step to the current step. ex. '2x + 4x'
 * @param startingStepAnswer - The actual answer of the equation.
 * @param firstChangeTypesLog - The first change types logged from the first step, for unknown and no change cases. TODO remove/refactor to not need this.
 * @param firstFoundToLog - The first found to logged from the first step, for unknown and no change cases.  TODO remove/refactor to not need this.
 */
function processStepInfo(
  res: CoreAssessUserStepResult,
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  firstChangeTypesLog: (AChangeType)[],
  firstFoundToLog: string[],
): StepInfo[] {
  const history = res.history
  userStep = cleanString(userStep)
  previousStep = cleanString(previousStep)

  history.forEach((step) => {
    step.to = cleanString(step.to)
    step.from = cleanString(step.from)
  })

  let stepInfo: StepInfo[]

  if (history.length === 0) {
    const firstAvailableChangeTypes = filterUniqueValues(firstChangeTypesLog.flat())
    const to = userStep // The user's step is the only step we have.
    const from = previousStep // The previous step is the only step we have.
    const isStartingStepsSame = from === to

    const attemptedChangeType = firstAvailableChangeTypes.length === 1 ? firstAvailableChangeTypes[0] : 'UNKNOWN' as const
    const attemptedToGetTo = firstFoundToLog.length === 1 ? firstFoundToLog[0] : 'UNKNOWN' as const
    const reachesOriginalAnswer = expressionEquals(getAnswerFromStep(userStep), startingStepAnswer)

    const sharedPart = { isValid: false, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: null, availableChangeTypes: firstAvailableChangeTypes, allPossibleCorrectTos: firstFoundToLog }
    stepInfo = isStartingStepsSame
      ? [{ ...sharedPart, reachesOriginalAnswer: true, mistakenChangeType: 'NO_CHANGE' }]
      : [{ ...sharedPart, reachesOriginalAnswer, mistakenChangeType: 'UNKNOWN' }]
  }
  // Handle the history Path to the found MistakeStep or found CorrectStep.
  else {
    stepInfo = history.map((step) => {
      const to = step.to
      const from = history.length === 1 ? (previousStep) : (step.from)

      const attemptedChangeType = step.attemptedChangeType || step.changeType
      const fixedMistakeType = correctChangeTypeSubtractToAddFix(attemptedChangeType, step.changeType || step.attemptedChangeType)

      const attemptedToGetTo = step.attemptedToGetTo || to
      const availableChangeTypes = filterUniqueValues(step.availableChangeTypes)
      const reachesOriginalAnswer = expressionEquals(getAnswerFromStep(to), startingStepAnswer)
      if (step.isMistake)
        return { isValid: false, reachesOriginalAnswer, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: fixedMistakeType, availableChangeTypes, allPossibleCorrectTos: step.allPossibleCorrectTos }

      // else
      // Handle Valid. Since we have a history and its not a found mistake, then the step is going to just be one of the valid ones.
      return { isValid: true, reachesOriginalAnswer, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: null, availableChangeTypes, allPossibleCorrectTos: step.allPossibleCorrectTos }
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
  const firstFoundToLog: string[] = []
  const rawAssessedStepOptionsRes = _coreAssessUserStep([previousUserStep, userStep], firstChangeTypesLog, firstFoundToLog)
  return processStepInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, startingStepAnswer, firstChangeTypesLog, firstFoundToLog)
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
