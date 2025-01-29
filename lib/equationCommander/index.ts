// noinspection UnnecessaryLocalVariableJS

import type { EqLRStepWithNewTo } from '~/equationCommander/Types'
import { findMatchingAddRemoveTerms, findNonAddRemoveRuleMatches, makeEquationProcessSteps, makeStartingLeftAndRightEqSteps } from '~/equationCommander/utils'
import { getAssessSolvedProblemSteps } from '~/kemuEquation/SimpleSolveEquationFunction'
import { areEquationsEqual } from '~/newServices/expressionEqualsAndNormalization'
import type { ProcessedEquation } from '~/simplifyExpression/equationEvaluation'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import type { AMathRule } from '~/types/changeType/MathRuleTypes'
import { getChangesTypesForRule } from '~/types/changeType/MathRuleTypes'
import { UndoableString } from '~/util/UndoableString'

// TODO remove redudant code. Make more efficient, repeated calls of assessedSteps and find all options.
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
  getFastestAmountOfStepsToSolve = (): number => this.assessedSteps.length
  getCurrentNumberOfSteps = (): number => this.assessedSteps.length

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
}
export default EquationCommander
