

import type { EqLRStepWithNewTo } from '~/equationCommander/Types'
import { findMatchingAddRemoveTerms, findNonAddRemoveRuleMatches, makeEquationProcessSteps, makeStartingLeftAndRightEqSteps } from '~/equationCommander/utils'
import { getFinalAnswerFromEquation } from '~/kemuEquation/SimpleSolveEquationFunction'
import { areEquationsEqual } from '~/newServices/expressionEqualsAndNormalization'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import type { AMathRule } from '~/types/changeType/MathRuleTypes'
import { getChangesTypesForRule } from '~/types/changeType/MathRuleTypes'
import { UndoableString } from '~/util/UndoableString'


export class EquationCommander {
  private equationHistory: UndoableString
  private readonly finalCorrectAnswer: string
  constructor(initialValue = '') {
    this.equationHistory = new UndoableString(initialValue)
    this.finalCorrectAnswer = getFinalAnswerFromEquation(initialValue)
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
        ? getChangesTypesForRule(rule)
        : Object.values(ChangeTypes).flat()

    return matches.filter(match => changeTypesForGivenRule.includes(match.left.changeType) || changeTypesForGivenRule.includes(match.right.changeType))
  }

  // Used for the dev CLI
  isAnAlterCommand(command: string) {
    const lower = command.trim().toLowerCase()
    return lower === 'back' || lower === 'undo' || lower === 'forward' || lower === 'redo' || lower.includes('swap')
  }

  // Used for the dev CLI
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
export default EquationCommander

