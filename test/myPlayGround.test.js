const {parseText} = require('../index')
const mathsteps = require('../index')
const kemuSortArgs = require('../lib/simplifyExpression/kemuSortArgs')
const clone = require('../lib/util/clone')
const EqualityCache = require('../lib/util/equalityCache')
const {myToString} = require('../lib/util/myUtil')
const {filterUniqueValues} = require('../lib/util/arrayUtils')
const {travelTree} = require('../lib/util/treeUtil')
const {cleanerMyToString} = require('../lib/util/myUtil')


function myMoreNormalization(node){
  travelTree(node,(_node)=>{
        // remove implicit multiplication.
    if(_node.implicit)
      _node.implicit = false

        // remove multiply by 1
    if(node.type === 'OperatorNode' && node.fn === 'multiply'){
      node.args = node.args.filter((arg)=>arg.toString() !== '1')
      if(node.args.length === 1)
        node = node.args[0]
    }
  })
  return node
}

const equalsCache =  new EqualityCache(stepEqualsCore)
const resultCache = new Map()

function stepEquals(step0, step1){
  return equalsCache.areEqual(step0,step1)
}
function stepEqualsCore(step0, step1){
  if(typeof step0 === 'string' && myToString(step0) === myToString(step1)) // naive string check
    return true
  if(!step0 || !step1) // fail
    return false

  let newStep0 = typeof step0 !== 'string'
      ? myMoreNormalization(kemuSortArgs(clone((step0))))
      : myMoreNormalization(kemuSortArgs(parseText(step0)))

  let newStep1 = typeof step1 !== 'string'
      ? myMoreNormalization(kemuSortArgs((clone(step1))))
      : myMoreNormalization(kemuSortArgs((parseText(step1))))

  return newStep0.equals(newStep1) || newStep0.toString() === newStep1.toString()
}


function getAllValidNextSteps(userStep, isDryRun = false, isWithAlternativeRun = true) {
  // Find if there's an equivalent cached result
  let foundKey = null
  for (let cachedStep of resultCache.keys()) {
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
    expressionCtx:undefined,
    isDryRun: isDryRun,
    isWithAlternativeRun: isWithAlternativeRun,
    getAllNextStepPossibilities: true,
    onStepCb: (step) => {
      // if(step.changeType === 'KEMU_ORIGINAL_EXPRESSION' || step.changeType === 'REARRANGE_COEFF')
      //  correctStepsFromHere.push(step)
      correctStepsFromHere.push(step)
    }
  })

  const onlyStepsWithTo = correctStepsFromHere.filter((step) => {
    return step.to
  })


  const toSet = new Set()
  const tosWithInfo = onlyStepsWithTo.map((step) => {
    const fromTos = step.to.map((to) => {
      return {
        changeType: step.changeType,
        to: to,
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
  const filteredTosWithInfo = filterUniqueValues(tosWithInfo, (item1,item2)=>stepEquals(item1.to,item2.to))
  // check if any equal each other

 // type NextStep = { to:string, from:string, changeType:string },
  // Cache the result using the userStep or its equivalent
  resultCache.set(userStep, filteredTosWithInfo)
  return {nextStep: filteredTosWithInfo, eventualAnswer}
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

    if (hasTried.has(start) || Array.from(hasTried).some((step)=>stepEquals(step,start)))
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

for(const step of userSteps){
  if(!lastStep){
    lastStep = step
    continue
  }
  const hasTried = []
  let start = performance.now()
  const steps = validStepFinder([lastStep,step],hasTried)
  let timeTaken = performance.now() - start
  console.log('Total time taken : ' + timeTaken + ' milliseconds')
  if(!steps || steps.length === 0)
    checkedSteps.push([{isInvalid:true, from:lastStep, to:step}])
  else{
    console.log('-----FOUND STEPS-----')
    checkedSteps.push(steps)
  }

  lastStep = step
}
  // print all
checkedSteps.forEach((steps,i)=> {
  console.log('steps',i)
  for(const step of steps){
    if(step.isInvalid)
      console.log(`invalid_change from: ${cleanerMyToString(step.from)} to: ${cleanerMyToString(step.to)}`)
    else
        console.log(`valid_change:${step.ogChangeType || step.changeType} from: ${cleanerMyToString(step.from)} to: ${cleanerMyToString(step.to)}`)
  }

})
