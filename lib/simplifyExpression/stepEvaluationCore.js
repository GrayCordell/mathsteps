import mathsteps from '~/index.js'
import { expressionEquals } from '~/util/expressionEqualsAndNormalization.js'
import { filterUniqueValues } from '~/util/arrayUtils.js'
import { LogLevel, logger } from '~/util/logger'
import { cleanString } from '~/util/mscStringUtils.js'

const stepEquals = (step0, step1) => expressionEquals(step0, step1)

const resultCache = new Map()
export function getAllValidNextSteps(userStep) {
  // Find if there's an equivalent cached result
  for (const cachedStep of resultCache.keys()) {
    if (stepEquals(cachedStep, userStep)) {
      return resultCache.get(cachedStep)
    }
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
  const tosWithInfo = correctStepsFromHere.filter(step => step.to).map(step =>
    step.to.map(to => ({
      changeType: step.changeType,
      to,
      mTo: step.mTo,
      from: step.from,
    }))).flat().filter((step) => {
    if (toSet.has(step.to))
      return false
    toSet.add(step.to)
    return true
  }).filter(step => step.to !== step.from)

  // check if any equal each other. If so, remove one of them
  const filteredTosWithInfo = filterUniqueValues(tosWithInfo, (item1, item2) => stepEquals(item1.to, item2.to))

  // type NextStep = { to:string,mTo:string|null from:string, changeType:string },
  // Cache the result using the userStep or its equivalent
  resultCache.set(userStep, filteredTosWithInfo)
  return { nextStep: filteredTosWithInfo }
}
function getAnswerFromStep(userStep) {
  // solve from this step
  const eventualAnswer = mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    getMistakes: false,
    isDryRun: false,
    isWithAlternativeRun: false,
    getAllNextStepPossibilities: false,
    // onStepCb: (step) => {
    // },
  })
  return eventualAnswer
}

const MAX_STEP_DEPTH = 100
export function validStepFinder(lastTwoUserSteps) {
  const valueToFind = lastTwoUserSteps[1]
  const queue = []
  const hasTried = new Set()

  // Initialize the queue with the first state and an empty history
  queue.push({ start: lastTwoUserSteps[0], history: [] })

  let depth = 0
  while (queue.length > 0 && depth < MAX_STEP_DEPTH) {
    let { start, history } = queue.shift() // Use shift for BFS (queue)
    start = cleanString(start)

    if (hasTried.has(start) || Array.from(hasTried).some(step => stepEquals(step, start)))
      continue
    hasTried.add(start)

    logger.deferred('-------------------', LogLevel.DEBUG)
    logger.deferred(`from:${start}, trying to find ${valueToFind}, depth:${depth}`, LogLevel.DEBUG)

    const { nextStep } = getAllValidNextSteps(start)

    if (!nextStep || nextStep.length === 0)
      continue

    for (const alternateStep of nextStep) {
      // Record the step in history
      const newHistory = [...history, alternateStep]

      if (stepEquals(alternateStep.to, valueToFind)) {
        // If the target is found, return the history leading up to it
        return { history: newHistory, hasFoundMToStep: false }
      }
      for (const mToStep of alternateStep.mTo) {
        if (stepEquals(mToStep.to, valueToFind)) {
          const butIsStillCorrect = stepEquals(getAnswerFromStep(start), getAnswerFromStep(mToStep.to))
          if (butIsStillCorrect)
            continue
          return { history: newHistory, hasFoundMToStep: true, mistakenChangeType: mToStep.changeType }
        }
      }

      queue.push({ start: alternateStep.to, history: newHistory })
    }

    depth++
  }

  return { history: [], hasFoundMToStep: false }
}

function makeStepsWithInfo(res, lastStep, userStep) {
  const history = res.history
  const hasFoundMToStep = res.hasFoundMToStep
  const mistakenChangeType = res.mistakenChangeType

  let newSteps = []
  if (history.length === 0) {
    newSteps = [{ isValid: false, from: lastStep, to: userStep }]
  }
  else {
    newSteps = history.map((evaledStep, index) => {
      const isLastStep = index === history.length - 1
      if (isLastStep && hasFoundMToStep)
        return { ...evaledStep, isValid: false, hasFoundMToStep, mTo: userStep, mistakenChangeType }
      return { ...evaledStep, isValid: true, hasFoundMToStep: false }
    })
  }
  return newSteps
}
/**
 *
 * @returns {Array<Array<{ isValid:boolean, from:string, to:string, changeType:string, mTo?:string, hasFoundMToStep:boolean }>>}
 * @param userSteps_ {string[]}
 */
export function evaluateUserSteps(userSteps_) {
  const userSteps = userSteps_.map(step => step.replace(/\s/g, ''))

  const checkedSteps = []
  let lastStep

  for (const userStep of userSteps) {
    // skip starting step. (Its the starting equation)
    if (!lastStep) {
      lastStep = userStep
      continue
    }

    const hasTried = []
    const res = validStepFinder([lastStep, userStep], hasTried)
    const newSteps = makeStepsWithInfo(res, lastStep, userStep)

    checkedSteps.push(newSteps)
    lastStep = userStep
  }

  return checkedSteps
}
