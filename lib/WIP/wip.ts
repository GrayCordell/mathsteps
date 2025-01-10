/*
import type { AChangeType } from '../../../../../Documents/GitHub/mathsteps/lib'
import type { ProcessedStep } from '../../../../../Documents/GitHub/mathsteps/lib/simplifyExpression/stepEvaluationCore'
import { findAllNextStepOptions } from '~/simplifyExpression/stepEvaluationCoreNextStepOptionsHelper.js'
import { cleanString, veryCleanEquation } from '~/util/stringUtils.js'
import { isAnOp, isOpEqual } from '../../../../../Documents/GitHub/mathsteps/lib/types/changeType/changeAndMistakeUtils'
// @ts-expect-error Node scratch file
import * as readline from 'node:readline'
import { ChangeTypes, myNodeToString, parseText } from '../../../../../Documents/GitHub/mathsteps/lib'
import { getFinalAnswerFromEquation, getNodeStepsToSolveEquation } from '../../../../../Documents/GitHub/mathsteps/lib/kemuEquation/simpleSolveEquationFunction'
import { areEquationsEqual } from '../../../../../Documents/GitHub/mathsteps/lib/newServices/expressionEqualsAndNormalization'
import { findChangesTypesForRule, sloppilyGetRuleBasedOnUserString } from '../../../../../Documents/GitHub/mathsteps/lib/types/changeType/MathRuleTypes'
import { filterUniqueValues } from '../../../../../Documents/GitHub/mathsteps/lib/util/arrayUtils'

interface EqProcessedSteps { left: ProcessedStep[], right: ProcessedStep[] }


// @ts-expect-error Node scratch file
const _process = process
const rl = readline.createInterface({
  input: _process.stdin,
  output: _process.stdout,
})

class UndoableString {
  private initialValue: string
  private value: string
  private history: string[]
  private future: string[]

  constructor(initialValue: string = '') {
    this.value = initialValue
    this.initialValue = initialValue
    this.history = []
    this.future = []
  }

  public getInitialValue(): string {
    return this.initialValue
  }

  // Get the current value of the string
  public getValue(): string {
    return this.value
  }

  // Update the value and save the current state to the history
  public setValue(newValue: string): void {
    this.history.push(this.value) // Save current value to history
    this.value = newValue
    this.future = [] // Clear future states
  }

  // Undo the last operation
  public undo(): void {
    if (this.history.length > 0) {
      this.future.push(this.value) // Save current value to future
      this.value = this.history.pop()! // Restore the last value
    }
    else {
      console.warn('Undo not available')
    }
  }

  // Redo the last undone operation
  public redo(): void {
    if (this.future.length > 0) {
      this.history.push(this.value) // Save current value to history
      this.value = this.future.pop()! // Restore the last undone value
    }
    else {
      console.warn('Redo not available')
    }
  }
}

// You can replace this with any initial equation you want
const STARTING_EQUATION = '2x/2 + 4x/2 = 100'
const equationHistory = new UndoableString(STARTING_EQUATION)

export function main() {
  console.log(`\nStarting with equation: ${STARTING_EQUATION}`)
  promptForCommand()
}
main()

/!**
 * Continuously asks for the command from the user.
 *!/
function promptForCommand() {
  rl.question('input command (or "exit" to quit): ', (command: string) => {
    const lower = command.trim().toLowerCase()

    if (lower === 'exit') {
      console.log('Exiting...')
      rl.close()
      return
    }
    if (command === 'back') {
      console.log('Going back to previous equation...')
      equationHistory.undo()
      console.log(`Current equation is now: ${equationHistory.getValue()}`)
      return promptForCommand()
    }
    if (command === 'redo') {
      console.log('Redoing...')
      equationHistory.redo()
      console.log(`Current equation is now: ${equationHistory.getValue()}`)
      return promptForCommand()
    }
    if (command.includes('swap')) {
      const currentEquation = equationHistory.getValue()
      const [left, right] = currentEquation.split('=')
      equationHistory.setValue(`${right}=${left}`)
      console.log(`Swapped equation: ${equationHistory.getValue()}`)
      return promptForCommand()
    }
    if (command.includes('solved')) {
      const getIsSolvedFn = () => {
        const finalCorrectAnswer = getFinalAnswerFromEquation(equationHistory.getInitialValue())
        const equationSolveStepsLeft = filterUniqueValues(getNodeStepsToSolveEquation(equationHistory.getValue()), (a, b) => a.equationString === b.equationString)
        const cantBeSimplified = equationSolveStepsLeft.length === 1
        if (cantBeSimplified) {
          const finalGivenAnswer = equationHistory.getValue()
          return areEquationsEqual(finalCorrectAnswer, finalGivenAnswer)
        }
        return false
      }
      const isSolved = getIsSolvedFn()
      const message = isSolved ? 'The equation is solved' : 'The equation is not solved'
      console.log(message)
      if (!isSolved) {
        console.log(`The correct answer is: ${getFinalAnswerFromEquation(equationHistory.getInitialValue())}`)
        console.log(`Your answer is: ${getFinalAnswerFromEquation(equationHistory.getValue())}`)
      }
      console.log(`Current equation is still: ${equationHistory.getValue()}`)
      return promptForCommand()
    }
    // Attempt to apply the rule to currentEquation
    equationRuleMatch(command, equationHistory.getValue(), (updatedEquation) => {
      equationHistory.setValue(updatedEquation)
      console.log(`Current equation is now: ${updatedEquation}`)
      // Then ask for another command
      return promptForCommand()
    })
  })
}


/!**
 * Finds rule matches for the user’s command and updates the equation accordingly.
 * Uses a callback (cb) to pass back the updated equation.
 *!/
function equationRuleMatch(
  command: string,
  equation: string,
  cb: (newEquation: string) => void,
) {
  if (command === 'redo' || command === 'back') // should not happen
    return cb(equation)

  const givenRule = sloppilyGetRuleBasedOnUserString(command)
  if (!givenRule) {
    console.log('No rule found for that command')
    // No change to equation
    return cb(equation)
  }

  const changeTypesForGivenRule
    = givenRule !== 'all'
      ? findChangesTypesForRule(givenRule)
      : Object.values(ChangeTypes).flat()

  // Build up the possible matches
  const startingLeftRight = makeStartingLeftAndRightEqSteps(equation)
  const eqProcessedSteps = makeEquationProcessSteps(equation)
  // console.log('Equation Processed Steps:\n' + makeLRString(eqProcessedSteps));

  const addRemoveCombo = findMatchingAddRemoveTerms(eqProcessedSteps)
  const ruleMatchAddRemove = addRemoveCombo.filter(option =>
    changeTypesForGivenRule.includes(option.left.changeType)
    || changeTypesForGivenRule.includes(option.right.changeType),
  )

  const nonAddRemoveRuleMatches = findNonAddRemoveRuleMatches(
    eqProcessedSteps,
    changeTypesForGivenRule,
    startingLeftRight,
  )

  const allRuleMatches = ruleMatchAddRemove
    .concat(nonAddRemoveRuleMatches)
    .map(option => ({
      left: option.left,
      right: option.right,
      newTo: `${option.left.to}=${option.right.to}`, // full equation after applying that step
    }))

  if (allRuleMatches.length === 0) {
    console.log('No rule matches found')
    return cb(equation)
  }
  else if (allRuleMatches.length === 1) {
    console.log('Rule match found (only one). Applying...')
    const chosenMatch = allRuleMatches[0]
    console.log(`Chosen Rule Match:\n${makeLRString(chosenMatch)}`)
    return cb(chosenMatch.newTo)
  }
  else {
    console.log('Multiple rule matches found:\n')
    allRuleMatches.forEach((step, index) =>
      console.log(`${index}: ${makeLRString(step)}`),
    )

    // Wait for the user to pick which match
    rl.question('Choose a rule match (index): ', (indexStr: string) => {
      const chosenIndex = Number.parseInt(indexStr)
      if (
        Number.isNaN(chosenIndex)
        || chosenIndex < 0
        || chosenIndex >= allRuleMatches.length
      ) {
        console.log('Invalid index chosen, no change made')
        return cb(equation)
      }
      else {
        const chosenMatch = allRuleMatches[chosenIndex]
        console.log(`Chosen Rule Match:\n${makeLRString(chosenMatch)}`)
        return cb(chosenMatch.newTo)
      }
    })
  }
}

//
// Utils
//
function findMatchingAddRemoveTerms(
  eqProcessedStep: EqProcessedSteps,
): { left: ProcessedStep, right: ProcessedStep }[] {
  const isTermMatchingForAddRemoveFn = (
    termA: ProcessedStep,
    termB: ProcessedStep,
  ): boolean => {
    const tryGetOpFn = (op: unknown) => (isAnOp(op) ? op : null)
    const opEqualsFn = (op1: unknown, op2: unknown) =>
      isOpEqual(tryGetOpFn(op1), tryGetOpFn(op2))

    const termAOp = termA?.addedNumOp?.op || termA?.removeNumberOp?.op
    const termANumber = termA?.addedNumOp?.number || termA?.removeNumberOp?.number

    const termBOp = termB?.addedNumOp?.op || termB?.removeNumberOp?.op
    const termBNumber = termB?.removeNumberOp?.number || termB?.addedNumOp?.number

    const termAAdded = termA.changeType.includes('ADD_TERM')
    const termBRemoved = termB.changeType.includes('REMOVE_TERM')
    const termARemoved = termA.changeType.includes('REMOVE_TERM')
    const termBAdded = termB.changeType.includes('ADD_TERM')

    if (termANumber !== termBNumber)
      return false
    if ((termAAdded && termBAdded) || (termARemoved && termBRemoved))
      return false
    if (!opEqualsFn(termAOp, termBOp))
      return false

    return true
  }

  const filterOutNonAddRemoveTermsFn = (options: ProcessedStep[]) =>
    options.filter(
      option =>
        option.changeType.includes('ADD_TERM')
        || option.changeType.includes('REMOVE_TERM'),
    )

  const leftOnlyAddRemoveTerms = filterOutNonAddRemoveTermsFn(eqProcessedStep.left)
  const rightOnlyAddRemoveTerms = filterOutNonAddRemoveTermsFn(eqProcessedStep.right)

  return leftOnlyAddRemoveTerms
    .map((leftProcessedStep) => {
      const matchedRight = rightOnlyAddRemoveTerms.find(rightProcessedStep =>
        isTermMatchingForAddRemoveFn(leftProcessedStep, rightProcessedStep),
      )
      return { left: leftProcessedStep, right: matchedRight }
    })
    .filter(option => option.right !== undefined) as {
    left: ProcessedStep
    right: ProcessedStep
  }[]
}

function makeStartingLeftAndRightEqSteps(
  equation: string,
): {
    left: ProcessedStep
    right: ProcessedStep
  } {
  const expressions = getExpressionsFromEquationFn(cleanString(equation))
  return {
    left: {
      from: expressions[0],
      to: expressions[0],
      changeType: 'NO_CHANGE',
      availableChangeTypes: [],
      isMistake: false,
    },
    right: {
      from: expressions[1],
      to: expressions[1],
      changeType: 'NO_CHANGE',
      availableChangeTypes: [],
      isMistake: false,
    },
  }
}

function getExpressionsFromEquationFn(equation: string) {
  return equation.split('=').map(expression => cleanString(expression))
}

function findNonAddRemoveRuleMatches(
  eqProcessedSteps: EqProcessedSteps,
  changeTypesForRule: AChangeType[],
  starting: { left: ProcessedStep, right: ProcessedStep },
): { left: ProcessedStep, right: ProcessedStep }[] {
  const nonAddRemoveTermsLeft = eqProcessedSteps.left.filter(
    (option: { changeType: string | string[] }) =>
      !option.changeType.includes('ADD_TERM')
      && !option.changeType.includes('REMOVE_TERM'),
  )
  const nonAddRemoveTermsRight = eqProcessedSteps.right.filter(
    (option: { changeType: string | string[] }) =>
      !option.changeType.includes('ADD_TERM')
      && !option.changeType.includes('REMOVE_TERM'),
  )

  const newFullEquationsFromLeft = nonAddRemoveTermsLeft.map(option => ({
    left: option,
    right: starting.right,
  }))
  const newFullEquationsFromRight = nonAddRemoveTermsRight.map(option => ({
    left: starting.left,
    right: option,
  }))
  const newFullEquations = newFullEquationsFromLeft.concat(newFullEquationsFromRight)

  return newFullEquations.filter(
    option =>
      changeTypesForRule.includes(option.left.changeType)
      || changeTypesForRule.includes(option.right.changeType),
  )
}

function makeEquationProcessSteps(equation: string): EqProcessedSteps {
  const expressions = getExpressionsFromEquationFn(cleanString(equation))
  const leftExpression = expressions[0]
  const rightExpression = expressions[1]
  return {
    left: findAllNextStepOptions(leftExpression, {
      otherSide: rightExpression,
      history: [],
    }),
    right: findAllNextStepOptions(rightExpression, {
      otherSide: leftExpression,
      history: [],
    }),
  }
}

// This code is all bad.. Its all temporary
function makeLRStringCore(obj: any) {
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
function makeLRString(obj: any): string {
  const start = makeLRStringCore(obj)
  const getChangeType = (obj: any) => (!obj.changeType || obj.changeType === 'NO_CHANGE') ? '' : obj.changeType
  const getBetterPrintableChangeType = (obj: any) => {
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
    return obj.changeType === 'NO_CHANGE' ? '' : replace.find(a => a[0] === obj.changeType)?.[1] || obj.changeType.replace(/_/g, ' ')
  }
  const veryVeryCleanEquation = (str: string) => veryCleanEquation(myNodeToString(parseText((str))))
  const getSimplifedSide = (obj: any) => obj.left.changeType === 'NO_CHANGE' && obj.right.changeType !== 'NO_CHANGE' ? 'left' : 'right'
  const printChangeTypeSide = (obj: any, side: 'left' | 'right') => (!obj.changeType || obj.changeType === 'NO_CHANGE') ? '' : `${veryVeryCleanEquation(side)}: ${getBetterPrintableChangeType(obj)}`
  const aSideHasTheChangeType = (obj: any, changeType: AChangeType) => obj.left.changeType === changeType || obj.right.changeType === changeType

  const printOperation = (obj: any) => {
    if (obj.left.changeType.includes('ADD_TERM') || obj.right.changeType.includes('ADD_TERM'))
      return `Operation: Applying ${obj.left.numOp.trim()} to both sides`
    // cross multiply
    if (aSideHasTheChangeType(obj, 'EQ_CROSS_MULTIPLY'))
      return `Operation: Cross multiplying`
    // EQ_SWAP_SIDES -- Don't think is currently possible here
    if (aSideHasTheChangeType(obj, 'EQ_SWAP_SIDES'))
      return `Operation: Swapping sides`
    // expression rules are all simplifications of a side
    // Here are some common ones
    if (aSideHasTheChangeType(obj, 'COLLECT_AND_COMBINE_LIKE_TERMS'))
      return `Operation: Combining like terms on ${getSimplifedSide(obj)}`
    if (aSideHasTheChangeType(obj, 'SIMPLIFY_ARITHMETIC__ADD'))
      return `Operation: Simplifying ${getSimplifedSide(obj)} by adding`
    if (aSideHasTheChangeType(obj, 'SIMPLIFY_ARITHMETIC__SUBTRACT'))
      return `Operation: Simplifying ${getSimplifedSide(obj)} by subtracting`
    if (aSideHasTheChangeType(obj, 'SIMPLIFY_ARITHMETIC__MULTIPLY'))
      return `Operation: Simplifying ${getSimplifedSide(obj)} by multiplying`
    if (aSideHasTheChangeType(obj, 'SIMPLIFY_ARITHMETIC__DIVIDE'))
      return `Operation: Simplifying ${getSimplifedSide(obj)} by dividing`
    // Distributive Property
    if (aSideHasTheChangeType(obj, 'KEMU_DISTRIBUTE_MUL_OVER_ADD'))
      return `Operation: Distributing multiplication over addition on ${getSimplifedSide(obj)}`

    // This will handle ones I didn't specify
    return `Operation: Simplifying ${getSimplifedSide(obj)} by ${getChangeType(obj)}`
  }

  const leftTo = veryCleanEquation(start.left.to)
  const rightTo = veryCleanEquation(start.right.to)

  const left = printChangeTypeSide(start.left, 'left')
  const right = printChangeTypeSide(start.right, 'right')
  const operation = printOperation(start)
  const equation = `New Equation: ${leftTo} = ${rightTo}`

  const PRINT_LEFT_RIGHT = false

  const better = PRINT_LEFT_RIGHT
    ? `\n${left}\n${right}\n${operation}\n${equation}\n\n`
    : `${operation}\n${equation}\n`

  return better
}
*/
