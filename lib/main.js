import mathsteps from '~/index.js'
import { equalsCache, expressionEquals } from './util/expressionEqualsAndNormalization.js'
import { filterUniqueValues } from './util/arrayUtils.js'
import { cleanerMyToString, myToString } from './util/myUtil.js'

console.log('-----START------')
const stepEquals = (step0, step1) => expressionEquals(step0, step1)

const resultCache = new Map()
function getAllValidNextSteps(userStep, isDryRun = false, isWithAlternativeRun = true) {
  // Find if there's an equivalent cached result
  let foundKey = null
  for (const cachedStep of resultCache.keys()) {
    if (equalsCache.areEqual(cachedStep, userStep)) {
      foundKey = cachedStep
      break
    }
  }
  if (foundKey) {
    console.log('Using cached result for equivalent userStep.')
    return resultCache.get(foundKey)
  }

  // solve from this step
  const correctStepsFromHere = []
  const eventualAnswer = mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    expressionCtx: undefined,
    isDryRun,
    isWithAlternativeRun,
    getAllNextStepPossibilities: true,
    onStepCb: (step) => {
      // if(step.changeType === 'KEMU_ORIGINAL_EXPRESSION' || step.changeType === 'REARRANGE_COEFF')
      //  correctStepsFromHere.push(step)
      correctStepsFromHere.push(step)
    },
  })

  const onlyStepsWithTo = correctStepsFromHere.filter((step) => {
    return step.to
  })

  const toSet = new Set()
  const tosWithInfo = onlyStepsWithTo.map((step) => {
    const fromTos = step.to.map((to) => {
      return {
        changeType: step.changeType,
        to,
        from: step.from,
      }
    })
    return fromTos
  }).flat().filter((step) => {
    if (toSet.has(step.to))
      return false
    toSet.add(step.to)
    return true
  })
  const filteredTosWithInfo = filterUniqueValues(tosWithInfo, (item1, item2) => stepEquals(item1.to, item2.to))
  // check if any equal each other

  // type NextStep = { to:string, from:string, changeType:string },
  // Cache the result using the userStep or its equivalent
  resultCache.set(userStep, filteredTosWithInfo)
  return { nextStep: filteredTosWithInfo, eventualAnswer }
}

const MAX_STEP_DEPTH = 30
function validStepFinder(lastTwoUserSteps) {
  const valueToFind = lastTwoUserSteps[1]
  const queue = []
  const hasTried = new Set()

  // Initialize the queue with the first state and an empty history
  queue.push({ start: lastTwoUserSteps[0], history: [] })

  let depth = 0
  while (queue.length > 0 && depth < MAX_STEP_DEPTH) {
    let { start, history } = queue.shift() // Use shift for BFS (queue)
    start = myToString(start)

    if (hasTried.has(start) || Array.from(hasTried).some(step => stepEquals(step, start)))
      continue
    hasTried.add(start)

    console.log('-------------------')
    console.log(`attempting from:${start}, to try to find ${valueToFind}, depth:${depth}`)

    const { nextStep } = getAllValidNextSteps(start, true, true)

    if (!nextStep || nextStep.length === 0)
      continue

    for (const alternateStep of nextStep) {
      // Record the step in history
      const newHistory = [...history, alternateStep]

      if (stepEquals(alternateStep.to, valueToFind)) {
        // If the target is found, return the history leading up to it
        return newHistory
      }

      queue.push({ start: alternateStep.to, history: newHistory })
    }

    depth++
  }

  return null // Return null if no valid steps lead to the found answer
}

console.log('-----START------')
const userSteps = [
  // '4 + 3 + (4 * 2 * 4/2)',
  // '4 + 3 + 8',
  '5x * 3x * 2x * x * 6x',
  '5x * 3x * 2x^2 * 6x',
  '5x * 6x^3 * 6x',
].map(step => step.replace(/\s/g, ''))
// printTree(simplifyCommon.kemuFlatten(parseText(userSteps[0])))
//
const checkedSteps = []
let lastStep

for (const step of userSteps) {
  if (!lastStep) {
    lastStep = step
    continue
  }
  const hasTried = []
  const start = performance.now()
  const steps = validStepFinder([lastStep, step], hasTried)
  const timeTaken = performance.now() - start
  console.log(`Total time taken : ${timeTaken} milliseconds`)
  if (!steps || steps.length === 0) {
    checkedSteps.push([{ isInvalid: true, from: lastStep, to: step }])
  }
  else {
    console.log('-----FOUND STEPS-----')
    checkedSteps.push(steps)
  }

  lastStep = step
}
// print all
checkedSteps.forEach((steps, i) => {
  console.log('steps', i)
  for (const step of steps) {
    if (step.isInvalid)
      console.log(`invalid_change from: ${cleanerMyToString(step.from)} to: ${cleanerMyToString(step.to)}`)
    else
      console.log(`valid_change:${step.ogChangeType || step.changeType} from: ${cleanerMyToString(step.from)} to: ${cleanerMyToString(step.to)}`)
  }
})
