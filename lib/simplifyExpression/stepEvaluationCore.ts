/**
 * @fileoverview
 * StepEvaluationCore.ts
 * This file contains the core logic for assessing users steps and skipped steps in solving an expression or equation.
 */
import type { MathNode } from 'mathjs'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { getValidStepEqCache } from '~/simplifyExpression/equationCache'
import { findAttemptedOperationUse } from '~/simplifyExpression/rules/stepEvaluationOnly/findAttemptedOperationUse'
import { findAllNextStepOptions } from '~/simplifyExpression/stepEvaluationCoreNextStepOptionsHelper'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers'
import { convertAdditionToSubtractionErrorType, isAnAdditionChangeType } from '~/types/changeType/changeAndMistakeUtils'
import type { AChangeType, AEquationChangeType } from '~/types/changeType/ChangeTypes'
import { EQUATION_ADD_AND_REMOVE_TERMS } from '~/types/changeType/ChangeTypes'
import type { NumberOp } from '~/types/NumberOp'
import { filterUniqueValues } from '~/util/arrayUtils'
import { cleanString } from '~/util/cleanString'

const countZero = (str: string) => (str.match(/\b0\b/g) || []).length

/**
 * Creates a history of steps found from the previous step to get to the user's step. Requires processStepInfo to convert the history into the final StepInfo[] form.
 */
export interface RawStep {
  from: string
  to: string[]
  changeType: AChangeType
  isMistake: boolean // the entire step is a mistake
  mTo?: { to: string, changeType: AChangeType }[]
}

/**
 * The processed step is the same as the raw step, but the 'to' is a string instead of an array of strings. We flattened it. TODO make a better name for this. IntermediateStep?
 * TODO: - A lot of this type is optional and is causing issues/confusion. It needs to be more strict and have less optional properties.
 * TODO: There is slight ambiguity between:  the "attempted", things and the "actual" things. Its fixed in processed steps but multiple/shared/slightly different definitions here are slightly confusing.
 */
export type ProcessedStep = Omit<RawStep, 'to'> & {
  to: string // to is a string instead of an array of strings. We flattened it.
  availableChangeTypes: AChangeType[]
  attemptedToGetTo?: string
  attemptedChangeType?: AChangeType
  allPossibleCorrectTos?: string[]
  equationActionType?: AEquationChangeType // TODO move out. Think its currently redundant with changeType. and should only exist in equationEvaluations return.
  addedNumOp?: NumberOp // TODO should have a seperate type for equation adding and removing terms.
  removeNumberOp?: NumberOp // -- should have a seperate type for equation adding and removing terms.
  deferDepth?: number
  isDeferred?: boolean // TODO remove? Just use deferDepth?
}


export interface CoreAssessUserStepResult {
  history: ProcessedStep[]
  firstFoundNextStepOptions: ProcessedStep[]
}

/**
 * The final step info object that is returned to the user. Less optionals.
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
  equationActionType?: AEquationChangeType// The type of equation action the user performed
  addedNumOp?: NumberOp // The operator and number the user could have used from the other side of the equation
  removeNumberOp?: NumberOp // The operator and number the user could have removed from the current side of the equation
}

interface QueueItem {
  start: string
  history: ProcessedStep[]
  isDeferred: boolean
  addedNumOp?: NumberOp
  removeNumberOp?: NumberOp
  deferDepth?: number
  loggedAllPossibleSteps?: ProcessedStep[]
}


const expressionEquals = (exp0: string | MathNode, exp1: string | MathNode) => areExpressionEqual(exp0, exp1, getValidStepEqCache())

const MAX_NEXT_STEPS = 110
const MAX_STEP_DEPTH = 4
const QUEUE_PRIORITY: AChangeType[] = ['REMOVE_ADDING_ZERO', 'DIVISION_BY_ONE', 'REMOVE_MULTIPLYING_BY_ONE', 'SIMPLIFY_ARITHMETIC__SUBTRACT', 'SIMPLIFY_ARITHMETIC__ADD', 'KEMU_DISTRIBUTE_MUL_OVER_ADD', 'SIMPLIFY_ARITHMETIC__MULTIPLY', 'CANCEL_TERMS_FOR_FRACTION', 'CANCEL_TERMS_FOR_ADDITION', 'SIMPLIFY_ARITHMETIC__DIVIDE', 'COLLECT_AND_COMBINE_LIKE_TERMS']

const DEFERRED_CHANGE_TYPES = [...EQUATION_ADD_AND_REMOVE_TERMS] as AChangeType[]
const DEFERRED_DEPTH_THRESHOLD = 3


//
// Helpers for coreAssessUserStep
//
function findAttachedMistakeThatEqualsValueToFind({ possibleStep, valueToFind, theProblem }: { possibleStep: ProcessedStep, valueToFind: string, theProblem: string }): ProcessedStep | null {
  for (const mToStep of possibleStep.mTo || []) {
    if (possibleStep.to && mToStep.to === possibleStep.to)
      continue

    if (expressionEquals(mToStep.to, valueToFind)) {
      // The mistake found can be a correct step somehow later. So we have to ignore incorrect steps that can become the answer.
      const isStillCorrect = expressionEquals(getAnswerFromStep(theProblem), getAnswerFromStep(mToStep.to))
      if (isStillCorrect)
        continue

      return { ...mToStep, ...possibleStep, from: possibleStep.from, to: mToStep.to, attemptedToGetTo: possibleStep.to, attemptedChangeType: possibleStep.changeType, changeType: mToStep.changeType, isMistake: true }
    }
  }
  return null
}
function hasAlreadyAttempted(currentStep: string, triedSteps: Set<string>): boolean {
  // Check if the exact expression is in the tried set
  if (triedSteps.has(currentStep))
    return true

  // Check for equivalent expressions in the tried set
  for (const attempted of triedSteps) {
    if (expressionEquals(attempted, currentStep))
      return true
  }

  // If neither exact match nor equivalent match is found, return false
  return false
}

function addStepToQueue(
  queue: QueueItem[],
  step: QueueItem,
  changeType: AChangeType,
) {
  const priorityIndex = QUEUE_PRIORITY.indexOf(changeType)
  if (priorityIndex === -1)
    queue.push(step)
  else
    queue.splice(priorityIndex, 0, step)
}
function checkForMatchingSteps({
  possibleSteps,
  valueToFind,
  history,
  theProblem,
  isEquation,
  stepCount,
  start,
}: {
  possibleSteps: ProcessedStep[]
  valueToFind: string
  history: ProcessedStep[]
  theProblem: string
  isEquation: boolean
  stepCount: number
  start: string
}): { history: ProcessedStep[] } | null {
  for (const possibleStep of possibleSteps) {
    const updatedHistory = [...history, possibleStep]

    if (expressionEquals(possibleStep.to, valueToFind)) {
      if (!possibleStep.isMistake) {
        return { history: updatedHistory }
      }
      else {
        const isStillCorrect = expressionEquals(
          getAnswerFromStep(theProblem),
          getAnswerFromStep(possibleStep.to),
        )
        if (!isStillCorrect)
          return { history: updatedHistory }
      }
    }

    if (!isEquation) {
      const foundAttachedMistake = findAttachedMistakeThatEqualsValueToFind({
        possibleStep,
        valueToFind,
        theProblem,
      })
      if (foundAttachedMistake) {
        updatedHistory.pop()
        updatedHistory.push(foundAttachedMistake)
        return { history: updatedHistory }
      }
    }
  }

  // special case to check for operation use. this can be picked up by available steps but this will also check for mistakes. Only do this on the first step for now.
  // TODO increase stepCount?
  // Direct action check. Different from find all options because this is a direct check for the action from the last to this step.
  if (stepCount === 0) {
    const opUseFound = findAttemptedOperationUse({
      from: start,
      to: valueToFind,
      expressionEquals,
    })
    const isEquationAndNotAMistake = isEquation && !opUseFound?.isMistake
    if (opUseFound && (isEquationAndNotAMistake || !isEquation)) {
      history.push({
        ...opUseFound,
        allPossibleCorrectTos: possibleSteps
          .filter(step => !step.isMistake)
          .map(step => step.to),
        availableChangeTypes: possibleSteps.map(step => step.changeType),
      })
      return { history }
    }
  }

  return null
}
export function coreAssessUserStep(
  lastTwoUserSteps: string[],
  otherSide: string | null = null,
): CoreAssessUserStepResult {
  const isEquation = otherSide !== null
  const valueToFind = lastTwoUserSteps[1]
  const theProblem = lastTwoUserSteps[0]
  const triedSteps = new Set<string>()
  let firstFoundNextStepOptions: ProcessedStep[] = []

  if (theProblem === valueToFind)
    return { history: [], firstFoundNextStepOptions: findAllNextStepOptions(valueToFind, { history: [], otherSide }) }

  const mainQueue: QueueItem[] = [{
    start: theProblem,
    history: [],
    isDeferred: false,
    deferDepth: 0,
  }]

  let stepCount = 0
  let differed: QueueItem[] = []

  while ((mainQueue.length > 0 || differed.length > 0) && stepCount < MAX_NEXT_STEPS) {
    //
    // Handle differed steps
    //

    // make all the differed depth go up by 1
    differed.forEach(differedStep => differedStep.deferDepth = (differedStep.deferDepth ?? 0) + 1)
    differed = differed.sort((a, b) => (b.deferDepth ?? 0) - (a.deferDepth ?? 0))
    // if the main queue is empty, then we can add the first differed step to the main queue.
    if (mainQueue.length === 0) {
      const first = differed.shift()
      if (first)
        mainQueue.push(first)
    }
    const differedThatPasses = differed.filter(step => (step?.deferDepth ?? 0) > DEFERRED_DEPTH_THRESHOLD)
    mainQueue.push(...differedThatPasses)
    differed = differed.filter(step => (step?.deferDepth ?? 0) <= DEFERRED_DEPTH_THRESHOLD)

    //
    // Handle chosen current step
    //
    // isDiffered is currently used to delay 'EQ_ADD_TERM' and 'EQ_REMOVE_TERM' steps.
    const currentStep = mainQueue.shift()
    if (!currentStep)
      continue
    const { start, history, isDeferred } = currentStep
    const cleanedStart = cleanString(start)
    const depth = history.length

    if (depth > MAX_STEP_DEPTH || hasAlreadyAttempted(cleanedStart, triedSteps))
      continue
    // Normally if we differed something we never checked if it was equal, so we check it here since its finally when we are going to check it.
    if (isDeferred && expressionEquals(start, valueToFind))
      return { history, firstFoundNextStepOptions }

    function nextStep(step: string): CoreAssessUserStepResult | undefined {
      triedSteps.add(step)

      //
      // Get all the available next steps options.
      // Sorted by ascending number of zeros in the expression (to prioritize removing zeros)
      let allPossibleNextStep = findAllNextStepOptions(step, { history, otherSide }).sort((a, b) => countZero(b.to) - countZero(a.to))

      //
      //  Handle differed steps.
      //
      differed.push(...allPossibleNextStep.filter(step => DEFERRED_CHANGE_TYPES.includes(step.changeType)).map(step => ({
        start: step.to,
        history: JSON.parse(JSON.stringify([...history, step])) as ProcessedStep[],
        depth: depth + 1,
        isDeferred: true,
        deferDepth: 0,
      })))
      // Remove the deferred steps from current available steps
      allPossibleNextStep = allPossibleNextStep.filter(step => !DEFERRED_CHANGE_TYPES.includes(step.changeType))
      ///

      // Log the first possible steps for later. Typically Used in cases where we don't find a match. TODO refactor to remove needing this.
      if (depth === 0) {
        // excludes mistakes
        firstFoundNextStepOptions = allPossibleNextStep.filter(step => !step.isMistake)
      }

      // Check for matching steps
      const matchResult = checkForMatchingSteps({
        possibleSteps: allPossibleNextStep,
        valueToFind,
        history,
        theProblem,
        isEquation,
        stepCount,
        start: cleanedStart,
      })
      if (matchResult) {
        return { ...matchResult, firstFoundNextStepOptions }
      }

      // Queue management
      allPossibleNextStep.forEach((possibleStep) => {
        addStepToQueue(mainQueue, {
          start: possibleStep.to,
          history: [...history, possibleStep],
          isDeferred: DEFERRED_CHANGE_TYPES.includes(possibleStep.changeType),
          deferDepth: 0,
        }, possibleStep.changeType)
      })
      stepCount++
    }

    const foundMatch = nextStep(cleanedStart)
    if (foundMatch)
      return foundMatch
  }

  return { history: [], firstFoundNextStepOptions }
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


// These two are also used in equationEvaluation. //TODO move to a shared file?
export function processNoHistoryStep({ from, to, startingStepAnswer, attemptedToGetTo, attemptedChangeType, firstFoundNextStepOptions }: { from: string, to: string, attemptedToGetTo?: string | null, firstFoundNextStepOptions: ProcessedStep[], attemptedChangeType?: AChangeType | null, startingStepAnswer: string }): StepInfo[] {
  const firstChangeTypesLog = firstFoundNextStepOptions.map(step => step.changeType)
  const firstFoundToLog = firstFoundNextStepOptions.map(step => step.to)
  const firstAvailableChangeTypes = filterUniqueValues(firstChangeTypesLog.flat())

  const attemptedChangeTypeCorrected = attemptedChangeType || (firstAvailableChangeTypes.length === 1 ? firstAvailableChangeTypes[0] : 'UNKNOWN' as const)
  const attemptedToGetToCorrected = attemptedToGetTo || (firstFoundToLog.length === 1 ? firstFoundToLog[0] : 'UNKNOWN' as const)
  const reachesOriginalAnswer = expressionEquals(getAnswerFromStep(to), startingStepAnswer)

  const sharedPart = { from, to, attemptedToGetTo: attemptedToGetToCorrected, reachesOriginalAnswer, attemptedChangeType: attemptedChangeTypeCorrected, availableChangeTypes: firstAvailableChangeTypes, allPossibleCorrectTos: firstFoundToLog } as const
  return expressionEquals(from, to)
    ? [{ ...sharedPart, isValid: true, mistakenChangeType: 'NO_CHANGE', attemptedChangeType: 'NO_CHANGE' }]
    : [{ ...sharedPart, isValid: false, mistakenChangeType: 'UNKNOWN' }]
}
export function processStep(step: ProcessedStep, previousStep: string, startingStepAnswer: string, historyLength: number): StepInfo & Partial<ProcessedStep> {
  const to = step.to
  const from = historyLength === 1 ? (previousStep) : (step.from)

  const attemptedChangeType = step.attemptedChangeType || step.changeType
  let fixedMistakeType = correctChangeTypeSubtractToAddFix(attemptedChangeType, step.changeType || step.attemptedChangeType)
  // TODO temp fix
  const removeIfOneOfTheseForNow = [
    'SIMPLIFY_ARITHMETIC__ADD',
    'SIMPLIFY_ARITHMETIC__DIVIDE',
    'SIMPLIFY_ARITHMETIC__MULTIPLY',
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
  ]
  if (removeIfOneOfTheseForNow.includes(fixedMistakeType))
    fixedMistakeType = 'UNKNOWN' as const

  const attemptedToGetTo = step.attemptedToGetTo || to
  const availableChangeTypes = filterUniqueValues(step.availableChangeTypes)

  const reachesOriginalAnswer = expressionEquals(getAnswerFromStep(to), startingStepAnswer)
  const stepAsPartial = step as Partial<StepInfo> // make all the properties optional so we can also just add all the original properties from the step.
  if (step.isMistake)
    return { ...stepAsPartial, isValid: false, reachesOriginalAnswer, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: fixedMistakeType, availableChangeTypes, allPossibleCorrectTos: step.allPossibleCorrectTos }

  // else
  // Handle Valid. Since we have a history and its not a found mistake, then the step is going to just be one of the valid ones.
  return { ...stepAsPartial, isValid: true, reachesOriginalAnswer, from, to, attemptedToGetTo, attemptedChangeType, mistakenChangeType: null, availableChangeTypes, allPossibleCorrectTos: step.allPossibleCorrectTos }
}


/**
 * @description Processes CoreAssessUserStepResult into the final StepInfo[] form
 * @param res - The result from coreAssessUserStep
 * @param previousStep - The previous step before the user's step. ex. '2x + 2x + 2x'
 * @param userStep - The users step moving from the previous step to the current step. ex. '2x + 4x'
 * @param startingStepAnswer - The actual answer of the equation.
 */
function processStepInfo(
  res: CoreAssessUserStepResult,
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
): StepInfo[] {
  const history = res.history
  userStep = cleanString(userStep)
  previousStep = cleanString(previousStep)
  history.forEach((step) => {
    step.to = cleanString(step.to)
    step.from = cleanString(step.from)
  })

  return history.length === 0
    ? processNoHistoryStep({ from: previousStep, to: userStep, startingStepAnswer, firstFoundNextStepOptions: res.firstFoundNextStepOptions })
    : history.map(step => processStep(step, previousStep, startingStepAnswer, history.length))
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
  const rawAssessedStepOptionsRes = coreAssessUserStep([previousUserStep, userStep])
  return processStepInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, startingStepAnswer)
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

