// noinspection UnnecessaryLocalVariableJS

import type { EqLRStepWithNewTo } from '~/equationCommander/Types'
import { findMatchingAddRemoveTerms, findNonAddRemoveRuleMatches, makeEquationProcessSteps, makeStartingLeftAndRightEqSteps } from '~/equationCommander/utils'
import { getAssessSolvedProblemSteps } from '~/kemuEquation/SimpleSolveEquationFunction'
import { areEquationsEqual } from '~/newServices/expressionEqualsAndNormalization'
import type { ProcessedEquation } from '~/simplifyExpression/equationEvaluation'
import type { ProcessedStep, StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { isAddTermChangeType, isRemoveTermChangeType } from '~/types/changeType/changeAndMistakeUtils'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import type { AMathRule } from '~/types/changeType/MathRuleTypes'
import { getChangesTypesForRule } from '~/types/changeType/MathRuleTypes'
import { UndoableString } from '~/util/UndoableString'


function getEquationMatches(currentEquation: string): { left: ProcessedStep, right: ProcessedStep, newTo: string }[] {
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


export const getFastestAmountOfStepsToSolveEquation = (assessedSteps: ProcessedEquation[]): number => {
  // 1. Filter out all NO_CHANGE steps
  // 2. Remove all removeTerms and addterms from right. (We will use all from left)
  // 3. remove all EQ_SWAP_SIDES on the right. (We only need 1)
  // 4. remove all EQ_MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE on the right. (We only need 1)
  // 5. Remove all REMOVE_ADDING_ZERO steps ( //TODO: possible issue if the starting step contains a 0+ or 0-., then we would be 1 step behind the users steps?)


  const removeNoChangeTypeStepsFn = (side: StepInfo[]) => side.filter(s => s.attemptedChangeType !== ChangeTypes.NO_CHANGE) // 1.
  const removeStuffFromRightFn = (side: StepInfo[]) => {
    return side
      .filter(s => !isRemoveTermChangeType(s.attemptedChangeType)) // 2.
      .filter(s => !isAddTermChangeType(s.attemptedChangeType)) // 2.
      .filter(s => s.attemptedChangeType !== ChangeTypes.EQ_SWAP_SIDES) // 3.
      .filter(s => s.attemptedChangeType !== ChangeTypes.EQ_MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE) // 4.
  }
  const removeRemoveAddingZeroFn = (side: StepInfo[]) => side.filter(s => s.attemptedChangeType !== ChangeTypes.REMOVE_ADDING_ZERO) // 5.


  assessedSteps = assessedSteps.map((step) => {
    const left = removeRemoveAddingZeroFn(removeNoChangeTypeStepsFn(step.left))
    const right = removeRemoveAddingZeroFn(removeNoChangeTypeStepsFn(removeStuffFromRightFn(step.right)))
    return { ...step, left, right }
  })

  // Now we need to count all the sub-steps
  let count = 0
  for (const step of assessedSteps) {
    count += step.left.length
    count += step.right.length
  }
  return count
}

// TODO remove redundant code. Make more efficient, repeated calls of assessedSteps and find all options.
export class EquationCommander {
  private equationHistory: UndoableString
  private readonly finalCorrectAnswer: string
  private readonly correctAnswerSteps: { equationString: string }[]
  private readonly assessedSteps: ProcessedEquation[]


  constructor(initialValue = '') {
    this.equationHistory = new UndoableString(initialValue)
    const { steps, assessedSteps } = getAssessSolvedProblemSteps(initialValue)
    this.correctAnswerSteps = steps
    this.assessedSteps = assessedSteps
    this.finalCorrectAnswer = steps[steps.length - 1].equationString
  }

  redo = (): void => this.equationHistory.redo()
  undo = (): void => this.equationHistory.undo()
  setValue = (newValue: string): void => this.equationHistory.setValue(newValue)
  getValue = (): string => this.equationHistory.getValue()
  isSolved = (): boolean => areEquationsEqual(this.finalCorrectAnswer, this.getValue()) // TODO add cache
  getHistory = (): string[] => this.equationHistory.getHistory()
  getFuture = (): string[] => this.equationHistory.getFuture()
  swap() {
    const currentEquation = this.getValue()
    const [left, right] = currentEquation.split('=')
    this.setValue(`${right}=${left}`)
  }

  getAssessedSteps = (): ProcessedEquation[] => this.assessedSteps
  getCorrectAnswerSteps = (): { equationString: string }[] => this.correctAnswerSteps
  getFastestAmountOfStepsToSolve = (): number => getFastestAmountOfStepsToSolveEquation(this.assessedSteps)
  getCurrentNumberOfSteps = (): number => this.assessedSteps.length
  getCurrentMatches(): EqLRStepWithNewTo[] {
    const allRuleMatches = getEquationMatches(this.getValue())

    // if any match starts with 0 + or 0 - then remove it
    const skippedZeroPlusMatches = allRuleMatches.map((match) => {
      const cleanStartingZeroToFn = (to: string) => to.replace(/^0[a-z]*[\+\-]/gmi, '')// remove 0+ or 0- or 0x+ or 0x-
      const left = cleanStartingZeroToFn(match.left.to)
      const right = cleanStartingZeroToFn(match.right.to)
      match.left.to = left
      match.right.to = right
      match.newTo = `${left}=${right}`
      return match
    })


    return skippedZeroPlusMatches
  }

  getMatchesForRule(rule: AMathRule | 'all'): EqLRStepWithNewTo[] {
    const matches = this.getCurrentMatches()

    const changeTypesForGivenRule
      = rule !== 'all'
        ? getChangesTypesForRule(rule)
        : Object.values(ChangeTypes).flat()

    return matches.filter(match => changeTypesForGivenRule.includes(match.left.changeType) || changeTypesForGivenRule.includes(match.right.changeType))
  }
}
export default EquationCommander
