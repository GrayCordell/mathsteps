import { getFinalAnswerFromEquation } from '~/kemuEquation/SimpleSolveEquationFunction'
import { areEquationsEqual } from '~/newServices/expressionEqualsAndNormalization'
import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import { findAllNextStepOptions } from '~/simplifyExpression/stepEvaluationCoreNextStepOptionsHelper'
import { isAnOp, isOpEqual } from '~/types/changeType/changeAndMistakeUtils'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import type { AMathRule } from '~/types/changeType/MathRuleTypes'
import { findChangesTypesForRule } from '~/types/changeType/MathRuleTypes'
import { cleanString } from '~/util/stringUtils'
import { UndoableString } from '~/util/UndoableString'
import type { EqLRStep, EqLRStepWithNewTo, EqProcessedSteps } from '~/WIP/Types'


export class EquationCommander {
  private equationHistory: UndoableString
  private finalCorrectAnswer: string
  constructor(initialValue = '') {
    this.equationHistory = new UndoableString(initialValue)
    this.finalCorrectAnswer = getFinalAnswerFromEquation(initialValue)
  }

  redo() {
    this.equationHistory.redo()
  }

  undo() {
    this.equationHistory.undo()
  }

  setValue(newValue: string) {
    this.equationHistory.setValue(newValue)
  }

  getValue() {
    return this.equationHistory.getValue()
  }

  isSolved() {
    return areEquationsEqual(this.finalCorrectAnswer, this.getValue())
  }

  swap() {
    const currentEquation = this.getValue()
    const [left, right] = currentEquation.split('=')
    this.setValue(`${right}=${left}`)
  }

  getCurrentMatches(): EqLRStepWithNewTo[] {
    const currentEquation = this.getValue()
    // Build up the possible matches
    const startingLeftRight = makeStartingLeftAndRightEqSteps(currentEquation)
    const eqProcessedSteps = makeEquationProcessSteps(currentEquation)

    const addRemoveCombo = findMatchingAddRemoveTerms(eqProcessedSteps)
    const nonAddRemoveRuleMatches = findNonAddRemoveRuleMatches(
      eqProcessedSteps,
      startingLeftRight,
    )
    const allRuleMatches = addRemoveCombo
      .concat(nonAddRemoveRuleMatches)
      .map(option => ({
        left: option.left,
        right: option.right,
        newTo: `${option.left.to}=${option.right.to}`, // full equation after applying that step
      }))
    return allRuleMatches
  }

  getMatchesForRule(rule: AMathRule | 'all'): EqLRStepWithNewTo[] {
    const matches = this.getCurrentMatches()

    const changeTypesForGivenRule
      = rule !== 'all'
        ? findChangesTypesForRule(rule)
        : Object.values(ChangeTypes).flat()

    return matches.filter(match => changeTypesForGivenRule.includes(match.left.changeType) || changeTypesForGivenRule.includes(match.right.changeType))
  }

  isAnAlterCommand(command: string) {
    const lower = command.trim().toLowerCase()
    return lower === 'back' || lower === 'undo' || lower === 'forward' || lower === 'redo' || lower.includes('swap')
  }

  callEquationAlterCommandBasedOnString(command: string) {
    const lower = command.trim().toLowerCase()
    if (lower === 'back' || lower === 'undo')
      this.undo()
    else if (lower === 'forward' || lower === 'redo')
      this.redo()
    else if (lower.includes('swap'))
      this.swap()
    else
      console.warn('Invalid command')
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
  const expressions = equation.split('=').map(expression => cleanString(expression))
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


function findNonAddRemoveRuleMatches(
  eqProcessedSteps: EqProcessedSteps,
  starting: { left: ProcessedStep, right: ProcessedStep },
): EqLRStep[] {
  const isNotAddOrRemoveTermFn = (option: { changeType: string | string[] }) => !option.changeType.includes('ADD_TERM') && !option.changeType.includes('REMOVE_TERM')
  const nonAddRemoveTermsLeft = eqProcessedSteps.left.filter((option: { changeType: string | string[] }) => isNotAddOrRemoveTermFn(option))
  const nonAddRemoveTermsRight = eqProcessedSteps.right.filter((option: { changeType: string | string[] }) => isNotAddOrRemoveTermFn(option))

  const newFullEquationsFromLeft = nonAddRemoveTermsLeft.map(option => ({
    left: option,
    right: starting.right,
  }))
  const newFullEquationsFromRight = nonAddRemoveTermsRight.map(option => ({
    left: starting.left,
    right: option,
  }))
  return newFullEquationsFromLeft.concat(newFullEquationsFromRight)
}

function makeEquationProcessSteps(equation: string): EqProcessedSteps {
  const expressions = equation.split('=').map(expression => cleanString(expression))
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


