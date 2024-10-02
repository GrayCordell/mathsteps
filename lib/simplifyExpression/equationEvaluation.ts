import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { getValidStepEqCache } from '~/simplifyExpression/equationCache'
import type { CoreAssessUserStepResult, StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { coreAssessUserStep, processNoHistoryStep, processStep } from '~/simplifyExpression/stepEvaluationCore'
import { getReverseOp } from '~/types/changeType/changeAndMistakeUtils'
import type { AChangeType, AEquationChangeType } from '~/types/changeType/ChangeTypes'
import { cleanString } from '~/util/stringUtils'

const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, getValidStepEqCache())

function processEquationInfo(
  equation: { lhs: CoreAssessUserStepResult, rhs: CoreAssessUserStepResult, equationChangeType: AEquationChangeType | undefined },
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  logs: { lhsFirstChangeTypesLog: AChangeType[], rhsFirstChangeTypesLog: AChangeType[], lhsFirstFoundToLog: string[], rhsFirstFoundToLog: string[] },
): { left: StepInfo[], right: StepInfo[], attemptedEquationChangeType: AEquationChangeType, equationErrorType?: AEquationChangeType } {
  const leftFrom = cleanString(previousStep.split('=')[0])
  const rightFrom = cleanString(previousStep.split('=')[1])
  const leftTo = cleanString(userStep.split('=')[0])
  const rightTo = cleanString(userStep.split('=')[1])

  if (equation.equationChangeType === 'EQ_SWAP_SIDES') {
    // do regular processing and then we will fix the rest
    const leftHistory = equation.lhs.history.map(step => processStep(step, leftFrom, startingStepAnswer, equation.lhs.history.length))
    const rightHistory = equation.rhs.history.map(step => processStep(step, rightFrom, startingStepAnswer, equation.rhs.history.length))
    // make changeType EQ_SWAP_SIDES
    leftHistory[0].attemptedChangeType = 'EQ_SWAP_SIDES'
    leftHistory[0].equationActionType = 'EQ_SWAP_SIDES'
    rightHistory[0].attemptedChangeType = 'EQ_SWAP_SIDES'
    rightHistory[0].equationActionType = 'EQ_SWAP_SIDES'
    // make isValid true
    leftHistory[0].isValid = true
    rightHistory[0].isValid = true
    return { left: leftHistory, right: rightHistory, attemptedEquationChangeType: equation.equationChangeType }
  }
  const rightRes = (equation.rhs.history.length === 0 || equation.equationChangeType === 'EQ_NO_CHANGE' || equation.equationChangeType === 'EQ_SIMPLIFY_LHS')
    ? processNoHistoryStep({ from: rightFrom, to: rightTo, startingStepAnswer, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN', firstChangeTypesLog: logs.rhsFirstChangeTypesLog, firstFoundToLog: logs.rhsFirstFoundToLog })
    : equation.rhs.history.map(step => processStep(step, rightFrom, startingStepAnswer, equation.rhs.history.length))
  const leftRes = (equation.lhs.history.length === 0 || equation.equationChangeType === 'EQ_NO_CHANGE' || equation.equationChangeType === 'EQ_SIMPLIFY_RHS')
    ? processNoHistoryStep({ from: leftFrom, to: leftTo, startingStepAnswer, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN', firstChangeTypesLog: logs.lhsFirstChangeTypesLog, firstFoundToLog: logs.lhsFirstFoundToLog })
    : equation.lhs.history.map(step => processStep(step, leftFrom, startingStepAnswer, equation.lhs.history.length))


  if (equation.equationChangeType === 'EQ_SIMPLIFY_BOTH' || equation.equationChangeType === 'EQ_SIMPLIFY_LHS' || equation.equationChangeType === 'EQ_SIMPLIFY_RHS') {
    return { left: leftRes, right: rightRes, attemptedEquationChangeType: equation.equationChangeType }
  }


  const allAddedLeft = leftRes.filter(step => step.addedNumOp)
  const allRemovedLeft = leftRes.filter(step => step.removeNumberOp)
  const allAddedRight = rightRes.filter(step => step.addedNumOp)
  const allRemovedRight = rightRes.filter(step => step.removeNumberOp)

  // check what was added or removed from each side
  const rRemovedFrom = { lhs: allRemovedLeft.length > 0, rhs: allRemovedRight.length > 0 }
  const rAddedTo = { lhs: allAddedLeft.length > 0, rhs: allAddedRight.length > 0 }
  const lRemovedFrom = { lhs: allRemovedLeft.length > 0, rhs: allRemovedRight.length > 0 }
  const lAddedTo = { lhs: allAddedLeft.length > 0, rhs: allAddedRight.length > 0 }


  const makeItemInvalidIfHasAttemptedToRemoveNumberOp = (arr: StepInfo[]) => arr.map(step => step.removeNumberOp ? { ...step, isValid: false } : step)
  const makeItemInvalidIfHasAttemptedToAddNumberOp = (arr: StepInfo[]) => arr.map(step => step.addedNumOp ? { ...step, isValid: false } : step)

  // if both removedFrom then make them both invalid
  if (lRemovedFrom.lhs && rRemovedFrom.rhs) {
    const left = makeItemInvalidIfHasAttemptedToRemoveNumberOp(leftRes)
    const right = makeItemInvalidIfHasAttemptedToRemoveNumberOp(rightRes)
    return { left, right, attemptedEquationChangeType: 'EQ_ATMPT_REMOVAL_BOTH_SIDES', equationErrorType: 'EQ_ATMPT_REMOVAL_BOTH_SIDES' }
  }

  // if both added to then make them both invalid
  if (lAddedTo.lhs && rAddedTo.rhs) {
    const left = makeItemInvalidIfHasAttemptedToAddNumberOp(leftRes)
    const right = makeItemInvalidIfHasAttemptedToAddNumberOp(rightRes)
    return { left, right, attemptedEquationChangeType: 'EQ_PLACED_BOTH_SIDES', equationErrorType: 'EQ_PLACED_BOTH_SIDES' }
  }
  // if added to one side and not removed from the other side then make them both invalid
  if (lAddedTo.lhs && !rRemovedFrom.rhs) {
    const left = makeItemInvalidIfHasAttemptedToAddNumberOp(leftRes)
    const right = makeItemInvalidIfHasAttemptedToRemoveNumberOp(rightRes)
    return { left, right, attemptedEquationChangeType: 'EQ_PLACED_LEFT_SIDE_ONLY', equationErrorType: 'EQ_PLACED_LEFT_SIDE_ONLY' }
  }
  else if (lAddedTo.rhs && !rRemovedFrom.lhs) {
    const left = makeItemInvalidIfHasAttemptedToRemoveNumberOp(leftRes)
    const right = makeItemInvalidIfHasAttemptedToAddNumberOp(rightRes)
    return { left, right, attemptedEquationChangeType: 'EQ_PLACED_RIGHT_SIDE_ONLY', equationErrorType: 'EQ_PLACED_RIGHT_SIDE_ONLY' }
  }


  const hasLeftAddedAndRightRemoved = lAddedTo.lhs && rRemovedFrom.rhs
  const hasRightAddedAndLeftRemoved = rAddedTo.rhs && lRemovedFrom.lhs
  if ((hasLeftAddedAndRightRemoved && allAddedLeft.length !== allRemovedRight.length) || (hasRightAddedAndLeftRemoved && allAddedRight.length !== allRemovedLeft.length)) {
    return { left: leftRes, right: rightRes, attemptedEquationChangeType: 'EQ_NOT_SAME_OP_PERFORMED', equationErrorType: 'EQ_NOT_SAME_OP_PERFORMED' }
  }
  else if (hasLeftAddedAndRightRemoved) {
    for (let i = 0; i < allAddedLeft.length; i++) {
      if (allAddedLeft[i].addedNumOp!.number !== allRemovedRight[i].removeNumberOp!.number && allAddedLeft[i].addedNumOp!.op !== getReverseOp(allRemovedRight[i].removeNumberOp!.op))
        return { left: leftRes, right: rightRes, attemptedEquationChangeType: 'EQ_NOT_SAME_OP_PERFORMED', equationErrorType: 'EQ_NOT_SAME_OP_PERFORMED' }
    }
  }
  else if (hasRightAddedAndLeftRemoved) {
    for (let i = 0; i < allAddedRight.length; i++) {
      if (allAddedRight[i].addedNumOp!.number !== allRemovedLeft[i].removeNumberOp!.number && allAddedRight[i].addedNumOp!.op !== getReverseOp(allRemovedLeft[i].removeNumberOp!.op))
        return { left: leftRes, right: rightRes, attemptedEquationChangeType: 'EQ_NOT_SAME_OP_PERFORMED', equationErrorType: 'EQ_NOT_SAME_OP_PERFORMED' }
    }
  }


  return { left: leftRes, right: rightRes, attemptedEquationChangeType: equation.equationChangeType || 'EQ_EQUATION_SOLVING' }
}
export function assessUserEquationStep(previousUserStep: string, userStep: string): { left: StepInfo[], right: StepInfo[], attemptedEquationChangeType: AEquationChangeType, equationErrorType?: AEquationChangeType } {
  // const startingStepAnswer = getAnswerFromEquation(previousUserStep)
  const logs = {
    lhsFirstChangeTypesLog: [] as AChangeType[],
    rhsFirstChangeTypesLog: [] as AChangeType[],
    lhsFirstFoundToLog: [] as string[],
    rhsFirstFoundToLog: [] as string[],
  }
  const rawAssessedStepOptionsRes = coreAssessUserStepEquation([previousUserStep, userStep], logs)
  // @ts-expect-error --- TODO get starting answer instead of null
  return processEquationInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, null, logs)
}
export function assessUserEquationSteps(userSteps: string[]): { left: StepInfo[], right: StepInfo[], attemptedEquationChangeType: AEquationChangeType, equationErrorType?: AEquationChangeType }[] {
  if (userSteps.length === 0)
    return []
  // const userSteps = userSteps_.map(step => myNodeToString(parseText(step)))

  const assessedSteps: { left: StepInfo[], right: StepInfo[], attemptedEquationChangeType: AEquationChangeType }[] = []
  let previousStep: string | undefined
  // const startingStepAnswer = getAnswerFromStep(userSteps[0])

  for (const userStep of userSteps) {
    // skip starting step. (Its the starting equation)
    if (!previousStep) {
      previousStep = userStep
      continue
    }
    const assessedStep = assessUserEquationStep(previousStep, userStep)
    assessedSteps.push(assessedStep)
    previousStep = userStep
  }


  return assessedSteps
}


export function coreAssessUserStepEquation([previousEquationStr, userEquationStr]: [string, string], logs: any): {
  lhs: CoreAssessUserStepResult
  rhs: CoreAssessUserStepResult
  equationChangeType: AEquationChangeType | undefined
} {
  const previousEquation = { lhs: cleanString(previousEquationStr.split('=')[0]), rhs: cleanString(previousEquationStr.split('=')[1]) }
  const userEquation = { lhs: cleanString(userEquationStr.split('=')[0]), rhs: cleanString(userEquationStr.split('=')[1]) }

  // Determine the operation applied to the equation
  const lhsUnchanged = expressionEquals(previousEquation.lhs, userEquation.lhs)
  const rhsUnchanged = expressionEquals(previousEquation.rhs, userEquation.rhs)

  // Case 0 - No changes
  if (lhsUnchanged && rhsUnchanged) {
    return {
      lhs: { history: [] },
      rhs: { history: [] },
      equationChangeType: 'EQ_NO_CHANGE',
    }
  }

  // Case 1: Swapping sides
  if (
    (!lhsUnchanged && !rhsUnchanged)
    && expressionEquals(previousEquation.lhs, userEquation.rhs)
    && expressionEquals(previousEquation.rhs, userEquation.lhs)
  ) {
    return {
      lhs: { history: [{ to: previousEquation.rhs, from: previousEquation.lhs, changeType: 'EQ_SWAP_SIDES', attemptedChangeType: 'EQ_SWAP_SIDES', isMistake: false, availableChangeTypes: [], attemptedToGetTo: previousEquation.rhs, allPossibleCorrectTos: [] }] },
      rhs: { history: [{ to: previousEquation.lhs, from: previousEquation.rhs, changeType: 'EQ_SWAP_SIDES', attemptedChangeType: 'EQ_SWAP_SIDES', isMistake: false, availableChangeTypes: [], attemptedToGetTo: previousEquation.lhs, allPossibleCorrectTos: [] }] },
      equationChangeType: 'EQ_SWAP_SIDES',
    }
  }

  function simplifySideCases(equationChangeType: 'EQ_SIMPLIFY_LHS' | 'EQ_SIMPLIFY_RHS') {
    const rhsRes = coreAssessUserStep([previousEquation.rhs, userEquation.rhs], logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog)
    const lhsRes = coreAssessUserStep([previousEquation.lhs, userEquation.lhs], logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog)
    return {
      lhs: lhsRes,
      rhs: rhsRes,
      equationChangeType,
    }
  }

  // Case 2 & 3: Simplifying one side
  if (!lhsUnchanged && rhsUnchanged) {
    return simplifySideCases('EQ_SIMPLIFY_LHS')
  }
  else if (lhsUnchanged && !rhsUnchanged) {
    return simplifySideCases('EQ_SIMPLIFY_RHS')
  }
  // Case 4 & 5: doing things with terms or simplifying both sides
  else /* if (!lhsUnchanged && !rhsUnchanged) */ {
    const lhsRes = coreAssessUserStep([previousEquation.lhs, userEquation.lhs], logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog, previousEquation.rhs)
    const rhsRes = coreAssessUserStep([previousEquation.rhs, userEquation.rhs], logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog, previousEquation.lhs)
    const hasAddedTerms = rhsRes.history.some(step => step.addedNumOp) || lhsRes.history.some(step => step.addedNumOp)
    const hasRemovedTerms = rhsRes.history.some(step => step.equationActionType === 'EQ_REMOVE_TERM') || lhsRes.history.some(step => step.equationActionType === 'EQ_REMOVE_TERM')


    if (hasAddedTerms || hasRemovedTerms) {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: undefined,
      }
    }
    return {
      lhs: lhsRes,
      rhs: rhsRes,
      equationChangeType: 'EQ_SIMPLIFY_BOTH',
    }
  }
}
