import mathsteps from '~/index.js'
import { filterUniqueValues } from '~/util/arrayUtils.js'
import { LogLevel, logger } from '~/util/logger'
import { cleanString } from '~/util/stringUtils.js'
import { EqualityCache } from '~/util/equalityCache.js'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization.js'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers.js'

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

  // fix all tos with ChangeTypes that are SIMPLIFY_ARITHMETIC__ADD but are actually simplifyArithmetic__subtract by checking if the amount of minus signs are less.
  for (const toWithInfo of filteredTosWithInfo) {
    if (toWithInfo.changeType === 'SIMPLIFY_ARITHMETIC__ADD') {
      const from = userStep
      const to = toWithInfo.to
      if (from.includes('-')) {
        // remove negativeNumber signs. (anytime *- or /- or +- is found, remove the minus sign)
        const removedNegativeSignFromFrom = from.replace(/([*\-+/])-/g, '$1')
        const removedNegativeSignFromTo = to.replace(/([*\-+/])-/g, '$1')
        const minusCountFrom = removedNegativeSignFromFrom.split('-').length - 1
        const minusCountTo = removedNegativeSignFromTo.split('-').length - 1
        if (minusCountFrom > minusCountTo)
          toWithInfo.changeType = 'SIMPLIFY_ARITHMETIC__SUBTRACT'
      }
    }
  }
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
      optionallyLogFirstChangeTypes.push(nextStep.map(step => step?.changeType))

    for (const alternateStep of nextStep) {
      // Record the step in history
      const newHistory = [...history, alternateStep]

      if (expressionEquals(alternateStep.to, valueToFind)) {
        // If the target is found, return the history leading up to it
        return { history: newHistory, isFoundStepAMistake: false }
      }
      for (const mToStep of alternateStep.mTo) {
        if (expressionEquals(mToStep.to, valueToFind)) {
          const butIsStillCorrect = expressionEquals(getAnswerFromStep(start), getAnswerFromStep(mToStep.to))
          if (butIsStillCorrect)
            continue
          return { history: newHistory, isFoundStepAMistake: true, mistakenChangeType: mToStep.changeType }
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
 * @returns Array<{isValid:boolean, isCorrect:boolean, from:string, to:string, validTo:string|null, correctChangeType:string|null, mistakenChangeType:string|null}>
 */
function makeStepsWithInfo(res, lastStep, userStep, startingStepAnswer, possibleChangeTypes = []) {
  possibleChangeTypes = possibleChangeTypes.flat()
  const history = res.history
  const isFoundStepAMistake = res.isFoundStepAMistake
  const mistakenChangeType = res.mistakenChangeType
  const isStartingStepsSame = lastStep === userStep
  const startingFrom = cleanString(lastStep) // original lastStep "from" value
  const wentTo = cleanString(userStep) // original userStep "to" value

  let newSteps = []
  if (history.length === 0) {
    const sharedPart = { isValid: false, from: startingFrom, to: wentTo, validTo: null, validChangeType: null }
    newSteps = isStartingStepsSame
      ? [{ ...sharedPart, isCorrect: true, mistakenChangeType: 'NO_CHANGE', possibleChangeTypes }] // same step, so it's correct. But not valid.
      : [{ ...sharedPart, isCorrect: false, mistakenChangeType: 'UNKNOWN', possibleChangeTypes }] // no steps found, so its invalid and incorrect. No mistake step was found
  }
  else {
    newSteps = history.map((evaledStep, index) => {
      const isLastStep = index === history.length - 1
      if (isLastStep && isFoundStepAMistake) {
        // Mistake Step found
        // if the last step is the one that has the mistakeStep, then lets make a new step that marks it as invalid&incorrect. Uses the found mistakenChangeType.
        return { isValid: false, isCorrect: false, from: startingFrom, to: wentTo, validTo: evaledStep.to, validChangeType: evaledStep.changeType, mistakenChangeType, possibleChangeTypes }
      }

      const hasSameEventualAnswer = expressionEquals(getAnswerFromStep(evaledStep.to), startingStepAnswer)
      // isValid because it was found in the history and wasn't a mistake. IsCorrect is based on the eventual answer being the equal to the starting problems eventual answer.
      return { isValid: true, isCorrect: hasSameEventualAnswer, from: startingFrom, to: wentTo, validTo: wentTo, validChangeType: evaledStep.changeType, mistakenChangeType: null, possibleChangeTypes }
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
