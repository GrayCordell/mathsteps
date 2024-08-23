import mathsteps from '~/index'
import { filterUniqueValues } from '~/util/arrayUtils'
import { LogLevel, logger } from '~/util/logger'
import { cleanString } from '~/util/stringUtils'
import { EqualityCache } from '~/util/equalityCache'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers.js'
import { mistakeSearches } from '~/simplifyExpression/mistakes/regexPemdasMistakes.js'
import type { AChangeType } from '~/types/ChangeTypes'
import { UNKNOWN } from '~/types/ChangeTypes'
import type { AMistakeType } from '~/types/ErrorTypes'
import { NO_CHANGE } from '~/types/ErrorTypes'

interface RawStep {
  from: string
  to: string[]
  changeType: AMistakeType & AChangeType
  isMistake: boolean // the entire step is a mistake
  mTo?: { to: string, changeType: AMistakeType }[]
}
type ProcessedStep = Omit<RawStep, 'to'> & { to: string } // to is a string instead of an array of strings. We flattend it.

type CoreAssessUserStepResult = {
  history: ProcessedStep[]
  isFoundStepAMistake: boolean
  mToStep?: string
  mistakenChangeType: AMistakeType
} | { history: [], isFoundStepAMistake: false }
| { history: ProcessedStep[], isFoundStepAMistake: false }

interface StepInfo {
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
const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, validStepEqCache)

function findAllNextStepOptions(userStep: string): ProcessedStep[] {
  userStep = cleanString(userStep)
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

  function processSteps(steps: RawStep[]) {
    const processedStepsSet = new Set<string>()
    return steps
      .filter(step => step.to)
      .flatMap(step => step.to.map(toStr => ({
        ...step,
        to: cleanString(toStr),
        from: cleanString(step.from),
      })))
      .filter(step => !processedStepsSet.has(step.to) && processedStepsSet.add(step.to))
      .filter(step => step.to !== step.from)
  }

  function correctStepInfo(filteredSteps: ProcessedStep[]) {
    for (const step of filteredSteps) {
      if (step.changeType === 'SIMPLIFY_ARITHMETIC__ADD') {
        const from = userStep
        const to = step.to
        if (!from.includes('-') || to.length > from.length)
          continue

        const numbersBeingSubtracted = [...from.matchAll(/(\d+)-(\d+)/g)].map(match => match[2])
        if (numbersBeingSubtracted.length === 0)
          continue

        const occurrencesMap = filterUniqueValues(
          numbersBeingSubtracted.map(number => ({ number, count: [...from.matchAll(new RegExp(number, 'g'))].length })),
          (a, b) => a.number === b.number,
        )

        const missing: string[] = []
        for (const numberAndCountObj of occurrencesMap) {
          const toNumberCount = [...to.matchAll(new RegExp(numberAndCountObj.number, 'g'))].length
          if (toNumberCount < numberAndCountObj.count)
            missing.push(numberAndCountObj.number)
        }
        if (missing.length === 1)
          step.changeType = 'SIMPLIFY_ARITHMETIC__SUBTRACT'
      }
    }
  }

  const filteredSteps = filterUniqueValues(processSteps(potentialSteps), (item1, item2) => expressionEquals(item1.to, item2.to))
  correctStepInfo(filteredSteps)

  // Mistake Steps that are not caught by the simplification engine.
  const manualMistakes = mistakeSearches(userStep)
  filteredSteps.push(...manualMistakes)

  return filteredSteps
}

const MAX_STEP_DEPTH = 100
function _coreAssessUserStep(lastTwoUserSteps: string[], firstChangeTypesLog: (AChangeType & AMistakeType)[]): CoreAssessUserStepResult {
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
function processStepInfo(
  res: CoreAssessUserStepResult,
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  availableChangeTypes: AChangeType[] = [],
): StepInfo[] {
  availableChangeTypes = filterUniqueValues(availableChangeTypes.flat())
  const history = res.history
  const isFoundStepAMistake = res.isFoundStepAMistake
  const mistakenChangeType = 'mistakenChangeType' in res ? res.mistakenChangeType : null

  let stepInfo: StepInfo[] = []
  if (history.length === 0) {
    const isStartingStepsSame = previousStep === userStep
    const startingFrom = cleanString(previousStep)
    const wentTo = cleanString(userStep)

    const sharedPart = { isValid: false, from: startingFrom, to: wentTo, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: UNKNOWN, mistakenChangeType: null, availableChangeTypes }
    stepInfo = isStartingStepsSame
      ? [{ ...sharedPart, reachesOriginalAnswer: true, mistakenChangeType: NO_CHANGE }]
      : [{ ...sharedPart, reachesOriginalAnswer: false, mistakenChangeType: UNKNOWN }]
  }
  else {
    stepInfo = history.map((step, index) => {
      const to = cleanString(step.to)
      const attemptedToGetTo = cleanString(step.to)
      const lastFrom = history.length === 1 ? cleanString(previousStep) : step.from
      const isLastStep = index === history.length - 1
      if (isLastStep && isFoundStepAMistake) {
        return { isValid: false, reachesOriginalAnswer: false, from: lastFrom, to: res.mToStep!, attemptedToGetTo, attemptedChangeType: step.changeType, mistakenChangeType, availableChangeTypes }
      }

      const hasSameEventualAnswer = expressionEquals(getAnswerFromStep(step.to), startingStepAnswer)
      return { isValid: true, reachesOriginalAnswer: hasSameEventualAnswer, from: lastFrom, to, attemptedToGetTo, attemptedChangeType: step.changeType, mistakenChangeType: null, availableChangeTypes }
    })
  }

  return stepInfo
  /**
   *
   * @param previousUserStep
   * @param userStep - The users step evaluate step ex. '5x'
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
}

export function assessUserStep(previousUserStep: string, userStep: string, startingStepAnswer: string = getAnswerFromStep(previousUserStep)): StepInfo[] {
  const firstChangeTypesLog: AChangeType[] = []
  const rawAssessedStepOptionsRes = _coreAssessUserStep([previousUserStep, userStep], firstChangeTypesLog)
  return processStepInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, startingStepAnswer, firstChangeTypesLog)
}

/**
 * Evaluates the sequence of steps a user took to simplify an expression and returns a detailed breakdown of each step.
 *
 * @param userSteps_ - An array of strings representing the steps the user took to simplify the expression, in order.
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
export function assessUserSteps(userSteps_: string[]): StepInfo[][] {
  if (userSteps_.length === 0)
    return []

  const userSteps = userSteps_.map(step => step.replace(/\s/g, ''))
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
