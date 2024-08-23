import mathsteps from '~/index'
import { filterUniqueValues } from '~/util/arrayUtils.js'
import { LogLevel, logger } from '~/util/logger'
import { cleanString } from '~/util/stringUtils.js'
import { EqualityCache } from '~/util/equalityCache.js'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization.js'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers.js'
import { mistakeSearches } from '~/simplifyExpression/mistakes/regexPemdasMistakes.js'

const validStepEqCache = new EqualityCache()
const expressionEquals = (exp0, exp1) => areExpressionEqual(exp0, exp1, validStepEqCache)
const validNextStepResultCache = {}
/**
 * @param userStep {string}
 * @returns any
 */
export function getAllValidNextSteps(userStep) {
  userStep = cleanString(userStep)
  // Find if there's an equivalent cached result
  for (const cachedStep of Object.keys(validNextStepResultCache)) {
    if (expressionEquals(cachedStep, userStep))
      return validNextStepResultCache[cachedStep]
  }

  // solve from this step
  const correctStepsFromHere = []
  mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    isDryRun: true,
    getMistakes: true,
    isWithAlternativeRun: true,
    getAllNextStepPossibilities: true,
    onStepCb: (step) => {
      correctStepsFromHere.push(step)
    },
  })

  const toSet = new Set()
  const tosWithInfo = correctStepsFromHere.filter(step => step.to).map(step => step.to.map(to => ({
    ...step, // changeType: step.changeType,
    to: cleanString(to),
    // mTo: step.mTo,
    from: cleanString(step.from),
  }))).flat().filter((step) => {
    if (toSet.has(step.to))
      return false
    toSet.add(step.to)
    return true
  }).filter(step => step.to !== step.from)

  // check if any equal each other. If so, remove one of them
  const filteredTosWithInfo = filterUniqueValues(tosWithInfo, (item1, item2) => expressionEquals(item1.to, item2.to))

  // fix all tos with ChangeTypes that are SIMPLIFY_ARITHMETIC__ADD but are actually SIMPLIFY_ARITHMETIC__SUBTRACT by checking if the amount of numbers that are missing
  // TODO. This is kind of a stupid hack. It also won't currently work with decimals or numbers +- the same number. I'd like to make subtraction not convert automatically to + negative number but it'd be a lot of work.
  for (const toWithInfo of filteredTosWithInfo) {
    if (toWithInfo.changeType === 'SIMPLIFY_ARITHMETIC__ADD') {
      const from = userStep
      const to = toWithInfo.to
      if (!from.includes('-'))
        continue
      if (to.length > from.length)
        continue

      // Not negative just minus. So cases of number - number. Ex. 5 - 10 + -15 => ['10']
      const numbersBeingSubtracted = [...from.matchAll(/(\d+)-(\d+)/g)].map(match => match[2])
      if (numbersBeingSubtracted.length === 0)
        continue

      // Ex. 5 - 10 + 10 => [{number: 10, count: 2}] because 10 is being subtracted and 10 occurs twice.
      const amtTheNumbersBeingSubtractedOccursMap = filterUniqueValues(
        numbersBeingSubtracted.map(number => ({ number, count: [...from.matchAll(new RegExp(number, 'g'))].length })),
        (a, b) => a.number === b.number,
      )

      // check if only 1 of the minus numbers have been removed. (Only 1 action)
      const missing = []
      for (const numberAndCountObj of amtTheNumbersBeingSubtractedOccursMap) {
        const toNumberCount = [...to.matchAll(new RegExp(numberAndCountObj.number, 'g'))].length
        if (toNumberCount >= numberAndCountObj.count)
          continue
        missing.push(numberAndCountObj.number)
      }
      if (missing.length === 1) // Exactly 1 subtraction event number is missing
        toWithInfo.changeType = 'SIMPLIFY_ARITHMETIC__SUBTRACT'
    }
  }

  const manualMistakesSearch = mistakeSearches(userStep)

  // Add the manual mistakes to the filteredTosWithInfo
  filteredTosWithInfo.push(...manualMistakesSearch)

  // type NextStep = { to:string,mTo:string|null from:string, changeType:string },
  // Cache the result using the userStep or its equivalent
  validNextStepResultCache[userStep] = filteredTosWithInfo
  return { nextStep: filteredTosWithInfo }
}

const MAX_STEP_DEPTH = 100

/**
 * @param lastTwoUserSteps {[string,string]}
 * @returns {{isFoundStepAMistake: boolean, mistakenChangeType, history:any[] }} -
 */
export function validStepFinder(lastTwoUserSteps, optionallyLogFirstChangeTypes = []) {
  const valueToFind = lastTwoUserSteps[1]
  const queue = []
  const hasTried = new Set()

  if (lastTwoUserSteps[0] === lastTwoUserSteps[1])
    return { history: [], isFoundStepAMistake: false }

  // Initialize the queue with the first state and an empty history
  queue.push({ start: lastTwoUserSteps[0], history: [] })

  let depth = 0
  while (queue.length > 0 && depth < MAX_STEP_DEPTH) {
    let { start, history } = queue.shift() // Use shift for BFS (queue)
    start = cleanString(start)

    if (hasTried.has(start) || Array.from(hasTried).some(step => expressionEquals(step, start)))
      continue
    hasTried.add(start)

    logger.deferred('-------------------', LogLevel.DEBUG)
    logger.deferred(`from:${start}, trying to find ${valueToFind}, depth:${depth}`, LogLevel.DEBUG)

    const { nextStep } = getAllValidNextSteps(start)

    if (!nextStep || nextStep.length === 0)
      continue
    if (depth === 0)
      optionallyLogFirstChangeTypes.push(nextStep.filter(step => !step?.isMistake).map(step => step?.changeType))

    for (const alternateStep of nextStep) {
      // Record the step in history
      const newHistory = [...history, alternateStep]

      if (!alternateStep.isMistake && expressionEquals(alternateStep.to, valueToFind)) {
        // If the target is found, return the history leading up to it
        return { history: newHistory, isFoundStepAMistake: false }
      }
      for (const mToStep of alternateStep.mTo) {
        if (!alternateStep.isMistake && alternateStep.to && mToStep.to === alternateStep.to)
          continue

        if (expressionEquals(mToStep.to, valueToFind)) {
          const butIsStillCorrect = expressionEquals(getAnswerFromStep(start), getAnswerFromStep(mToStep.to))
          if (butIsStillCorrect)
            continue
          return { history: newHistory, mToStep: mToStep.to, isFoundStepAMistake: true, mistakenChangeType: mToStep.changeType }
        }
      }

      queue.push({ start: alternateStep.to, history: newHistory })
    }

    depth++
  }

  return { history: [], isFoundStepAMistake: false }
}

/**
 *
 * @param res
 * @param lastStep {string}
 * @param userStep {string}
 * @param startingStepAnswer {string}
 * @param availableChangeTypes {string[]}
 */
function makeStepsWithInfo(res, lastStep, userStep, startingStepAnswer, availableChangeTypes = []) {
  availableChangeTypes = filterUniqueValues(availableChangeTypes.flat())
  const history = res.history
  const isFoundStepAMistake = res.isFoundStepAMistake
  const mistakenChangeType = res.mistakenChangeType

  let newSteps = []
  if (history.length === 0) {
    const isStartingStepsSame = lastStep === userStep
    const startingFrom = cleanString(lastStep) // original lastStep "from" value
    const wentTo = cleanString(userStep) // original userStep "to" value

    const sharedPart = { isValid: false, from: startingFrom, to: wentTo, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN' }
    newSteps = isStartingStepsSame
      ? [{ ...sharedPart, reachesOriginalAnswer: true, mistakenChangeType: 'NO_CHANGE', availableChangeTypes }] // same step, so it's correct. But not valid.
      : [{ ...sharedPart, reachesOriginalAnswer: false, mistakenChangeType: 'UNKNOWN', availableChangeTypes }] // no steps found, so its invalid and incorrect. No mistake step was found
  }
  else {
    newSteps = history.map((evaledStep, index) => {
      const to = cleanString(evaledStep.to)
      const attemptedToGetTo = cleanString(evaledStep.attemptedToGetTo || evaledStep.to)
      const lastFrom = history.length === 1 ? cleanString(lastStep) : evaledStep.from // lastStep is slightly better for making sense of things.
      const isLastStep = index === history.length - 1
      if (isLastStep && isFoundStepAMistake) {
        // Mistake Step found
        // if the last step is the one that has the mistakeStep, then lets make a new step that marks it as invalid&!reachesOriginalAnswer. Uses the found mistakenChangeType.
        // TODO I put reachesOriginalAnswer as false here but it could be true. I just don't know why you'd want to know and I'd also have run getting the answer here. Change?
        return { isValid: false, reachesOriginalAnswer: false, from: lastFrom, to: res.mToStep, attemptedToGetTo, attemptedChangeType: evaledStep.changeType, mistakenChangeType, availableChangeTypes }
      }

      const hasSameEventualAnswer = expressionEquals(getAnswerFromStep(evaledStep.to), startingStepAnswer)
      // isValid because it was found in the history and wasn't a mistake. reachesOriginalAnswer is based on the eventual answer being the equal to the starting problems eventual answer.
      return { isValid: true, reachesOriginalAnswer: hasSameEventualAnswer, from: lastFrom, to, attemptedToGetTo, attemptedChangeType: evaledStep.changeType, mistakenChangeType: null, availableChangeTypes }
    })
  }

  return newSteps
}
/**
 * @param userSteps_ {string[]}
 * @note: 'from' given back here is different than the from in validStepFinder. From given back will always be the last step in the userSteps_ array. From in  validStepFinder was the parsed/evaluated/cachedValue.
 */
export function evaluateUserSteps(userSteps_) {
  if (userSteps_.length === 0) {
    return []
  }
  const userSteps = userSteps_.map(step => step.replace(/\s/g, ''))

  const checkedSteps = []
  let lastStep

  const startingStepAnswer = getAnswerFromStep(userSteps[0])

  for (const userStep of userSteps) {
    // skip starting step. (Its the starting equation)
    if (!lastStep) {
      lastStep = userStep
      continue
    }

    const firstChangeTypesLog = []
    const res = validStepFinder([lastStep, userStep], firstChangeTypesLog)

    const newSteps = makeStepsWithInfo(res, lastStep, userStep, startingStepAnswer, firstChangeTypesLog)

    checkedSteps.push(newSteps)
    lastStep = userStep
  }

  return checkedSteps
}
