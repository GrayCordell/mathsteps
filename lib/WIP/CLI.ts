import readline from 'node:readline'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { parseText } from '~/newServices/nodeServices/parseText'
import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { ALL_MATH_RULES, sloppilyGetRuleBasedOnUserString } from '~/types/changeType/MathRuleTypes'
import { veryCleanEquation } from '~/util/stringUtils'
import { EquationCommander } from '~/WIP/EquationCommander'

const STARTING_EQUATION = '2x/2 + 4x/2 = 100'
const makePrintableMath = (str: string) => {
  const core = (str: string) => veryCleanEquation(myNodeToString(parseText((str))))
  if (str.includes('=')) {
    const [left, right] = str.split('=')
    return `${core(left)} = ${core(right)}`
  }
  else {
    return core(str)
  }
}

// eslint-disable-next-line node/prefer-global/process
const _process = process
const rl = readline.createInterface({
  input: _process.stdin,
  output: _process.stdout,
})

// Function to prompt the user and wait for input
function askQuestion(query: string, rl: readline.Interface): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      resolve(answer)
    })
  })
}


const ALLOWED_COMMANDS = [
  // Info
  'solve',

  // Matching Rules
  'all', // everything
  ...ALL_MATH_RULES,

  // Swapping sides
  'swap',

  // Altering the equation through history
  'undo',
  'redo',
] as const

/**
 * Continuously asks for the command from the user.
 */
export async function RUN_DEV_MATH_RULE_CLI(startingEquation = STARTING_EQUATION) {
  const equationCommander = new EquationCommander(STARTING_EQUATION)
  async function core() {
    const updatedEquation = equationCommander.getValue()

    console.log(`Current equation is now: ${makePrintableMath(updatedEquation)}`)
    const command = await askQuestion('input command (or "exit" to quit): ', rl)
    const lower = command.trim().toLowerCase()
    const mathRuleBasedOnTheString = sloppilyGetRuleBasedOnUserString(lower)

    if (lower === 'exit') {
      console.log('Exiting...')
      rl.close()
      return
    }
    else if (lower.includes('solve')) {
      const message = equationCommander.isSolved() ? 'Correct!' : 'Incorrect'
      console.log(message)
    }
    else if (equationCommander.isAnAlterCommand(command)) {
      const lower = command.trim().toLowerCase()

      if (lower === 'back' || lower === 'undo') {
        console.log('undoing')
        equationCommander.undo()
      }
      else if (lower === 'forward' || lower === 'redo') {
        console.log('redoing')
        equationCommander.redo()
      }
      else {
        console.log('swapping sides')
        equationCommander.swap()
      }
    }
    else if (mathRuleBasedOnTheString) {
      const matches = equationCommander.getMatchesForRule(mathRuleBasedOnTheString)

      if (matches.length === 0) {
        console.log('No rule matches found')
      }
      else if (matches.length === 1) {
        console.log('Rule match found (only one). Applying...')
        const chosenMatch = matches[0]
        console.log(`Chosen Rule Match:\n${makeLRString(chosenMatch)}`)
        equationCommander.setValue(chosenMatch.newTo)
      }
      else {
        console.log('Multiple rule matches found:\n')
        matches.forEach((lrStep, index) => console.log(`${index}: ${makeLRString(lrStep)}`))
        const ruleIndex = await askQuestion('Choose a rule match (index): ', rl)
        // Wait for the user to pick which match
        const chosenIndex = Number.parseInt(ruleIndex)
        let message = ''
        if (Number.isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= matches.length) {
          message = 'Invalid index chosen, no change made'
        }
        else {
          const match = matches[chosenIndex]
          message = `Chosen Rule Match:\n${makeLRString(match)}`
          equationCommander.setValue(match.newTo)
        }
        console.log(message)
      }
    }
    else {
      console.log('Invalid command')
    }
    return core()
  }
  await core()
}
// RUN_DEV_MATH_RULE_CLI().then(r => console.log('done'))


// This code is all bad.. Its all temporary
function makeLRStringCore(obj: { left: ProcessedStep, right: ProcessedStep, newTo: string }): { left: ProcessedStep, right: ProcessedStep, newTo: string } {
  // remove properties we don't want to print from objects right now
  const cleanFn = (option: any) => {
    // remove properties we don't want to print from objects right now
    const propertiesToRemove = [
      'availableChangeTypes',
      'isMistake',
      'isValid',
      'reachesOriginalAnswer',
      'attemptedChangeType',
      'attemptedToGetTo',
      'rootNode',
      'mTo',
      'allPossibleCorrectTos',
    ]
    for (const property of propertiesToRemove)
      delete option[property]
    // remove undefined or null
    for (const key in option) {
      if (option[key] === undefined || option[key] === null) {
        delete option[key]
      }
    }

    if (option.left)
      option.left = cleanFn(option.left)
    if (option.right)
      option.right = cleanFn(option.right)

    return option
  }
  const newObj = cleanFn(JSON.parse(JSON.stringify(obj)))

  // Helper function to process numerical operations and update the object
  const processNumericalOperation = (side: Record<string, any>, key: string): void => {
    const formatNumOp = (numOp: { op: string, number: number } | null): string => numOp ? ` ${numOp.op} ${numOp.number}` : ''

    if (side[key]) {
      side.numOp = formatNumOp(side[key])
      delete side[key]
    }
  };

  // Process numerical operations for both left and right sides of the object
  ['addedNumOp', 'removeNumberOp'].forEach((key) => {
    processNumericalOperation(newObj.left, key)
    processNumericalOperation(newObj.right, key)
  })


  return newObj
}

// This code is all bad.. Its all temporary
function makeLRString(obj: { left: ProcessedStep, right: ProcessedStep, newTo: string }): string {
  const start = makeLRStringCore(obj)
  const getPrintableChangeType = (step: ProcessedStep) => {
    const replace = [
      ['EQ_ADD_TERM_BY_ADDITION', 'Adding Term by Addition'],
      ['EQ_REMOVE_TERM_BY_ADDITION', 'Removing Term by Addition'],
      ['EQ_ADD_TERM_BY_MULTIPLICATION', 'Adding Term by Multiplication'],
      ['EQ_REMOVE_TERM_BY_MULTIPLICATION', 'Removing Term by Multiplication'],
      ['KEMU_DISTRIBUTE_MUL_OVER_ADD', 'Distribute Multiplication Over Addition'],
      ['COLLECT_AND_COMBINE_LIKE_TERMS', 'Combine Like Terms'],
      ['SIMPLIFY_ARITHMETIC__ADD', 'Add'],
      ['SIMPLIFY_ARITHMETIC__SUBTRACT', 'Subtract'],
      ['SIMPLIFY_ARITHMETIC__MULTIPLY', 'Multiply'],
      ['SIMPLIFY_ARITHMETIC__DIVIDE', 'Divide'],
      ['EQ_CROSS_MULTIPLY', 'Cross Multiply'],
    ]
    return step.changeType === 'NO_CHANGE' ? '' : replace.find(a => a[0] === step.changeType)?.[1] || step.changeType.replace(/_/g, ' ')
  }
  const getSimplifedSide = () => start.left.changeType === 'NO_CHANGE' && start.right.changeType !== 'NO_CHANGE' ? 'left' : 'right'
  const aSideHasTheChangeType = (changeType: AChangeType) => start.left.changeType === changeType || start.right.changeType === changeType

  const getOperationMessage = (obj: { left: any, right: any, newTo: string }) => {
    if (obj.left.changeType.includes('ADD_TERM') || obj.right.changeType.includes('ADD_TERM'))
      return `Operation: Applying ${obj.left.numOp.trim()} to both sides`
    // cross multiply
    if (aSideHasTheChangeType('EQ_CROSS_MULTIPLY'))
      return `Operation: Cross multiplying`
    // EQ_SWAP_SIDES -- Don't think is currently possible here
    if (aSideHasTheChangeType('EQ_SWAP_SIDES'))
      return `Operation: Swapping sides`
    // expression rules are all simplifications of a side
    // Here are some common ones
    if (aSideHasTheChangeType('COLLECT_AND_COMBINE_LIKE_TERMS'))
      return `Operation: Combining like terms on ${getSimplifedSide()}`
    if (aSideHasTheChangeType('SIMPLIFY_ARITHMETIC__ADD'))
      return `Operation: Simplifying ${getSimplifedSide()} by adding`
    if (aSideHasTheChangeType('SIMPLIFY_ARITHMETIC__SUBTRACT'))
      return `Operation: Simplifying ${getSimplifedSide()} by subtracting`
    if (aSideHasTheChangeType('SIMPLIFY_ARITHMETIC__MULTIPLY'))
      return `Operation: Simplifying ${getSimplifedSide()} by multiplying`
    if (aSideHasTheChangeType('SIMPLIFY_ARITHMETIC__DIVIDE'))
      return `Operation: Simplifying ${getSimplifedSide()} by dividing`
    if (aSideHasTheChangeType('KEMU_DISTRIBUTE_MUL_OVER_ADD'))
      return `Operation: Distributing multiplication over addition on ${getSimplifedSide()}`

    // This will handle ones I didn't specify
    const changeTypeLeft = getPrintableChangeType(obj.left)
    const changeTypeRight = getPrintableChangeType(obj.right)
    if (!changeTypeLeft && !changeTypeRight)
      return ''
    if (!changeTypeLeft)
      return `Operation: Applying ${changeTypeRight} to the right side`
    if (!changeTypeRight)
      return `Operation: Applying ${changeTypeLeft} to the left side`
    return `Operation: Applying ${changeTypeLeft} to the left side and ${changeTypeRight} to the right side`
  }

  const leftTo = makePrintableMath(start.left.to)
  const rightTo = makePrintableMath(start.right.to)
  const operation = getOperationMessage(start)
  const equation = `New Equation: ${leftTo} = ${rightTo}`

  return `${operation}\n${equation}\n`
}
