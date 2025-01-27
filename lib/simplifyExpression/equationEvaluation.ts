import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { getValidStepEqCache } from '~/simplifyExpression/equationCache'
import type { CoreAssessUserStepResult, StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { coreAssessUserStep, processNoHistoryStep, processStep } from '~/simplifyExpression/stepEvaluationCore'
import { getAnswerFromEquation } from '~/simplifyExpression/stepEvaluationHelpers'
import { isAddTermChangeType, isOpEqual, isRemoveTermChangeType } from '~/types/changeType/changeAndMistakeUtils'
import type { AEquationChangeType } from '~/types/changeType/ChangeTypes'
import type { NumberOp } from '~/types/NumberOp'
import { cleanString } from '~/util/cleanString'

const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, getValidStepEqCache())

export interface ProcessedEquation {
  left: StepInfo[]
  right: StepInfo[]
  attemptedEquationChangeType: AEquationChangeType
  equationErrorType?: AEquationChangeType
  reachesOriginalAnswer: boolean
}

/**
 * @param leftRes
 * @param rightRes
 * @mutates leftRes and rightRes by setting isValid to true or false based on if the steps are equal.
 */
function makeActionsValidOrInvalidBasedOnNonComplimentedAddOrRemove(leftRes: StepInfo[], rightRes: StepInfo[]): void {
  const leftChanges = leftRes.filter(step => step.addedNumOp || step.removeNumberOp)
  const rightChanges = rightRes.filter(step => step.addedNumOp || step.removeNumberOp)
  const largestLength = Math.max(leftChanges.length, rightChanges.length)
  for (let i = 0; i < largestLength; i++) {
    const getNumOp = (step?: StepInfo) => step?.addedNumOp || step?.removeNumberOp
    const leftChange = leftChanges?.[i]
    const rightChange = rightChanges?.[i]
    if (leftChange && !rightChange) {
      leftChange.isValid = false
      continue
    }
    if (rightChange && !leftChange) {
      rightChange.isValid = false
      continue
    }
    const leftNumOp = getNumOp(leftChange)!
    const rightNumOp = getNumOp(rightChange)!


    const isEqualFn = (lStepOp: NumberOp, rStepOp: NumberOp) => expressionEquals(lStepOp.number, rStepOp.number) && isOpEqual(lStepOp.op, rStepOp.op)
    let areChangesEqual = isEqualFn(leftNumOp, rightNumOp)
    // lets check 1 Ahead too just in case. TODO could have a very specific edgeCase, but that would likely require many removed/added terms.
    if (!areChangesEqual) {
      const rStepOpNext = getNumOp(rightChanges?.[i + 1])
      if (rStepOpNext)
        areChangesEqual = isEqualFn(leftNumOp, rightNumOp)
    }


    if (areChangesEqual) {
      leftChange.isValid = true
      rightChange.isValid = true
    }
    else {
      leftChange.isValid = false
      rightChange.isValid = false
    }
  }
}


// Note the order checks 1 ahead. Do not use for order.
function getEquationOperationsValidity(leftRes: StepInfo[], rightRes: StepInfo[]): boolean[] {
  const leftChange = leftRes.filter(step => step.addedNumOp || step.removeNumberOp)
  const rightChange = rightRes.filter(step => step.addedNumOp || step.removeNumberOp)
  const equationNumOpValidity: boolean[] = []
  const largestLength = Math.max(leftChange.length, rightChange.length)
  for (let i = 0; i < largestLength; i++) {
    const getNumOp = (step?: StepInfo) => step?.addedNumOp || step?.removeNumberOp
    const lStepOp = getNumOp(leftChange?.[i])
    const rStepOp = getNumOp(rightChange?.[i])
    if (!lStepOp || !rStepOp) {
      equationNumOpValidity.push(false)
      continue
    }
    const isEqualFn = (lStepOp: NumberOp, rStepOp: NumberOp) => expressionEquals(lStepOp.number, rStepOp.number) && isOpEqual(lStepOp.op, rStepOp.op)
    let areStepsEqual = isEqualFn(lStepOp, rStepOp)
    // lets check 1 Ahead too just in case. TODO could have a very specific edgeCase, but that would likely require many removed/added terms.
    if (!areStepsEqual) {
      const rStepOpNext = getNumOp(rightChange?.[i + 1])
      if (rStepOpNext)
        areStepsEqual = isEqualFn(lStepOp, rStepOpNext)
    }

    equationNumOpValidity.push(areStepsEqual)
  }
  return equationNumOpValidity
}
/**
 * @param left
 * @param right
 * @param reachesOriginalAnswer
 * @mutates can mutate (left|right)Res[number].(removeNumberOp|addedNumOp) isValid.
 */
function invalidProcedure(left: StepInfo[], right: StepInfo[], reachesOriginalAnswer: boolean): ProcessedEquation | null {
  const allAddedLeft = left.filter(step => step.addedNumOp)
  const allRemovedLeft = left.filter(step => step.removeNumberOp)
  const allAddedRight = right.filter(step => step.addedNumOp)
  const allRemovedRight = right.filter(step => step.removeNumberOp)

  // check what was added or removed from each side
  const isRightRemovedFrom = allRemovedRight.length > 0
  const isRightAddedTo = allAddedRight.length > 0
  const isLeftAddedTo = allAddedLeft.length > 0
  const isLeftRemovedFrom = allRemovedLeft.length > 0
  const hasLeftAddedAndRightRemoved = allAddedLeft.length > 0 && allRemovedRight.length > 0
  const hasRightAddedAndLeftRemoved = allAddedRight.length > 0 && allRemovedLeft.length > 0


  function makeError(left: StepInfo[], right: StepInfo[], attemptedEquationChangeType: AEquationChangeType, equationErrorType: AEquationChangeType) {
    return { left, right, attemptedEquationChangeType, equationErrorType, reachesOriginalAnswer }
  }
  function makeDefaultError(leftRes: StepInfo[], rightRes: StepInfo[], error: AEquationChangeType) {
    return makeError(leftRes, rightRes, 'EQ_ATMPT_OP_BOTH_SIDES', error)
  }

  if (isLeftRemovedFrom && isRightRemovedFrom) // if both removedFrom then make them both invalid
    return makeDefaultError(left, right, 'EQ_ATMPT_REMOVAL_BOTH_SIDES')
  if (isLeftAddedTo && isRightAddedTo) // if both added to then make them both invalid
    return makeDefaultError(left, right, 'EQ_ADDED_DIFF_TERMS_TO_BOTH_SIDES')

  if ((isLeftRemovedFrom && !isRightAddedTo))
    return makeDefaultError(left, right, 'EQ_PLACED_LEFT_SIDE_ONLY')
  if ((isLeftAddedTo && !isRightRemovedFrom))
    return makeDefaultError(left, right, 'EQ_PLACED_LEFT_SIDE_ONLY')

  if (isRightRemovedFrom && !isLeftAddedTo)
    return makeDefaultError(left, right, 'EQ_PLACED_RIGHT_SIDE_ONLY')
  if ((isRightAddedTo && !isLeftRemovedFrom))
    return makeDefaultError(left, right, 'EQ_PLACED_RIGHT_SIDE_ONLY')


  // If we made it here the equation hasAddedAndRemoved a term
  // First check if the number of added and removed terms are the same, if not then we don't have to look
  if ((hasLeftAddedAndRightRemoved && allAddedLeft.length !== allRemovedRight.length) || (hasRightAddedAndLeftRemoved && allAddedRight.length !== allRemovedLeft.length)) {
    return makeDefaultError(left, right, 'EQ_NOT_SAME_OP_PERFORMED')
  }
  // If we have any invalid addedNumOp | removeNumberOp  steps.
  else if (hasLeftAddedAndRightRemoved || hasRightAddedAndLeftRemoved) {
    const getHasInvalidEquationOp = (step: StepInfo) => !step.isValid && (step.addedNumOp || step.removeNumberOp)
    if (left.some(step => getHasInvalidEquationOp(step))
      || right.some(step => getHasInvalidEquationOp(step))) {
      return makeDefaultError(left, right, 'EQ_NOT_SAME_OP_PERFORMED')
    }
  }

  return null
}

function processEquationInfo(
  equation: { lhs: CoreAssessUserStepResult, rhs: CoreAssessUserStepResult, equationChangeType: AEquationChangeType | undefined },
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  startingStepAnswerForEquation: string,
): ProcessedEquation {
  const leftFrom = cleanString(previousStep.split('=')[0])
  const rightFrom = cleanString(previousStep.split('=')[1])
  const leftTo = cleanString(userStep.split('=')[0])
  const rightTo = cleanString(userStep.split('=')[1])

  // TODO room to improve performance
  const reachesOriginalAnswer = (() => {
    const leftOgAnswer = startingStepAnswerForEquation.split('=')[0]
    const rightOgAnswer = startingStepAnswerForEquation.split('=')[1]
    const leftNewAnswer = getAnswerFromEquation(userStep).split('=')[0]
    const rightNewAnswer = getAnswerFromEquation(userStep).split('=')[1]

    const normalIsEqual = expressionEquals(leftOgAnswer, leftNewAnswer) && expressionEquals(rightOgAnswer, rightNewAnswer)
    const flippedIsEqual = expressionEquals(leftOgAnswer, rightNewAnswer) && expressionEquals(rightOgAnswer, leftNewAnswer)
    return normalIsEqual || flippedIsEqual
  })()

  if (equation.equationChangeType === 'EQ_SWAP_SIDES') {
    // do regular processing and then we will fix the rest
    const leftHistory = equation.lhs.history.map(step => processStep(step, leftFrom, startingStepAnswer, equation.lhs.history.length))
    const rightHistory = equation.rhs.history.map(step => processStep(step, rightFrom, startingStepAnswer, equation.rhs.history.length))
    // make changeType EQ_SWAP_SIDES
    // leftHistory[0].attemptedChangeType = equation.equationChangeType
    // leftHistory[0].equationActionType = equation.equationChangeType
    // rightHistory[0].attemptedChangeType = equation.equationChangeType
    // rightHistory[0].equationActionType = equation.equationChangeType
    // make isValid true
    // leftHistory[0].isValid = true
    // rightHistory[0].isValid = true
    return { left: leftHistory, right: rightHistory, attemptedEquationChangeType: equation.equationChangeType, reachesOriginalAnswer }
  }
  const rightRes = (equation.rhs.history.length === 0 || equation.equationChangeType === 'EQ_NO_CHANGE' || equation.equationChangeType === 'EQ_SIMPLIFY_LHS')
    ? processNoHistoryStep({ from: rightFrom, to: rightTo, startingStepAnswer, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN', firstFoundNextStepOptions: equation.rhs.firstFoundNextStepOptions })
    : equation.rhs.history.map(step => processStep(step, rightFrom, startingStepAnswer, equation.rhs.history.length))
  const leftRes = (equation.lhs.history.length === 0 || equation.equationChangeType === 'EQ_NO_CHANGE' || equation.equationChangeType === 'EQ_SIMPLIFY_RHS')
    ? processNoHistoryStep({ from: leftFrom, to: leftTo, startingStepAnswer, attemptedToGetTo: 'UNKNOWN', attemptedChangeType: 'UNKNOWN', firstFoundNextStepOptions: equation.rhs.firstFoundNextStepOptions })
    : equation.lhs.history.map(step => processStep(step, leftFrom, startingStepAnswer, equation.lhs.history.length))

  if (equation.equationChangeType === 'EQ_SIMPLIFY_BOTH' || equation.equationChangeType === 'EQ_SIMPLIFY_LHS' || equation.equationChangeType === 'EQ_SIMPLIFY_RHS') {
    return { left: leftRes, right: rightRes, attemptedEquationChangeType: equation.equationChangeType, reachesOriginalAnswer }
  }


  const isValidEquationOperations = getEquationOperationsValidity(leftRes, rightRes).every(val => val)
  makeActionsValidOrInvalidBasedOnNonComplimentedAddOrRemove(leftRes, rightRes)

  if (!isValidEquationOperations) {
    const invalidRes = invalidProcedure(leftRes, rightRes, reachesOriginalAnswer)
    if (invalidRes)
      return invalidRes
    else
      throw new Error('Invalid procedure did not return anything')
  }

  return { left: leftRes, right: rightRes, attemptedEquationChangeType: equation.equationChangeType || 'EQ_ATMPT_OP_BOTH_SIDES', reachesOriginalAnswer }
}
export function assessUserEquationStep(previousUserStep: string, userStep: string, startingStepAnswerForEquation: string): ProcessedEquation {
  // const startingStepAnswer = getAnswerFromEquation(previousUserStep)
  const rawAssessedStepOptionsRes = coreAssessUserStepEquation([previousUserStep, userStep])
  // @ts-expect-error --- TODO get starting answer instead of null
  return processEquationInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, null, startingStepAnswerForEquation)
}
export function assessUserEquationSteps(userSteps: string[]): ProcessedEquation[] {
  if (userSteps.length === 0)
    return []
  // const userSteps = userSteps_.map(step => myNodeToString(parseText(step)))

  const assessedSteps: ReturnType<typeof assessUserEquationStep>[] = []
  let previousStep: string | undefined
  const startingStepAnswerForEquation = getAnswerFromEquation(userSteps[0])

  for (const userStep of userSteps) {
    // skip starting step. (Its the starting equation)
    if (!previousStep) {
      previousStep = userStep
      continue
    }
    const assessedStep = assessUserEquationStep(previousStep, userStep, startingStepAnswerForEquation)
    assessedSteps.push(assessedStep)
    previousStep = userStep
  }


  return assessedSteps
}


export function coreAssessUserStepEquation([previousEquationStr, userEquationStr]: [string, string]): {
  lhs: CoreAssessUserStepResult
  rhs: CoreAssessUserStepResult
  equationChangeType: AEquationChangeType | undefined
} {
  const previousEquation = { lhs: cleanString(previousEquationStr.split('=')[0]), rhs: cleanString(previousEquationStr.split('=')[1]) }
  const userEquation = { lhs: cleanString(userEquationStr.split('=')[0]), rhs: cleanString(userEquationStr.split('=')[1]) }

  // Determine the operation applied to the equation
  const lhsChanged = !expressionEquals(previousEquation.lhs, userEquation.lhs)
  const lhsUnchanged = !lhsChanged
  const rhsChanged = !expressionEquals(previousEquation.rhs, userEquation.rhs)
  const rhsUnchanged = !rhsChanged
  const lhsOnlyChanged = lhsChanged && !rhsChanged
  const rhsOnlyChanged = rhsChanged && !lhsChanged


  const lhsRes = lhsOnlyChanged
    ? coreAssessUserStep([previousEquation.lhs, userEquation.lhs])
    : coreAssessUserStep([previousEquation.lhs, userEquation.lhs], previousEquation.rhs)
  const rhsRes = rhsOnlyChanged
    ? coreAssessUserStep([previousEquation.rhs, userEquation.rhs]) // previousEquation.lhs <- Not included because its an expression if we are only changing one side
    : coreAssessUserStep([previousEquation.rhs, userEquation.rhs], previousEquation.lhs) // pass in the other side to allow for equation change types)
  // Case 0: No changes
  if (lhsUnchanged && rhsUnchanged) {
    return {
      lhs: lhsRes,
      rhs: rhsRes,
      equationChangeType: 'EQ_NO_CHANGE',
    }
  }

  // Case 1: Swapping sides
  if (
    (lhsChanged && rhsChanged)
    && expressionEquals(previousEquation.lhs, userEquation.rhs)
    && expressionEquals(previousEquation.rhs, userEquation.lhs)
  ) {
    return {
      lhs: {
        history:
          [
            {
              to: previousEquation.rhs,
              attemptedToGetTo: previousEquation.rhs,
              from: previousEquation.lhs,
              changeType: 'EQ_SWAP_SIDES',
              attemptedChangeType: 'EQ_SWAP_SIDES',
              isMistake: false,
              availableChangeTypes: lhsRes.firstFoundNextStepOptions?.[0]?.availableChangeTypes || [],
              allPossibleCorrectTos: lhsRes.firstFoundNextStepOptions.map(step => step.to),
            },
          ],
        firstFoundNextStepOptions: lhsRes.firstFoundNextStepOptions,
      },
      rhs: {
        history: [
          {
            to: previousEquation.lhs,
            attemptedToGetTo: previousEquation.lhs,
            from: previousEquation.rhs,
            changeType: 'EQ_SWAP_SIDES',
            attemptedChangeType: 'EQ_SWAP_SIDES',
            isMistake: false,
            availableChangeTypes: rhsRes.firstFoundNextStepOptions?.[0]?.availableChangeTypes || [],
            allPossibleCorrectTos: rhsRes.firstFoundNextStepOptions.map(step => step.to),
          },
        ],
        firstFoundNextStepOptions: rhsRes.firstFoundNextStepOptions,
      },
      equationChangeType: 'EQ_SWAP_SIDES',
    }
  }

  // Case 2 & 3: Simplifying one side
  if (lhsOnlyChanged) {
    return { lhs: lhsRes, rhs: rhsRes, equationChangeType: 'EQ_SIMPLIFY_LHS' }
  }
  else if (rhsOnlyChanged) {
    return { lhs: lhsRes, rhs: rhsRes, equationChangeType: 'EQ_SIMPLIFY_RHS' }
  }
  // Case 4 & 5: doing things with terms or simplifying both sides
  else /* if (!lhsUnchanged && !rhsUnchanged) */ {
    // Could have issues if done twice implicitly? Not sure how or why you would do that though.
    const hasMultiplyBothSidesByNegativeOneLeft = lhsRes.history.some(step => step.changeType === 'EQ_MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE')
    const hasMultiplyBothSidesByNegativeOneRight = rhsRes.history.some(step => step.changeType === 'EQ_MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE')
    if (hasMultiplyBothSidesByNegativeOneLeft || hasMultiplyBothSidesByNegativeOneRight) {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: 'EQ_MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE',
      }
    }

    // Could have issues if done twice implicitly? Not sure how or why you would do that though.
    const hasCrossMultiplyLeft = lhsRes.history.some(step => step.changeType === 'EQ_CROSS_MULTIPLY')
    const hasCrossMultiplyRight = rhsRes.history.some(step => step.changeType === 'EQ_CROSS_MULTIPLY')
    if (hasCrossMultiplyLeft || hasCrossMultiplyRight) {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: 'EQ_CROSS_MULTIPLY',
      }
    }

    const hasAddedTerms = rhsRes.history.some(step => isAddTermChangeType(step.changeType)) || lhsRes.history.some(step => isAddTermChangeType(step.changeType))
    const hasRemovedTerms = rhsRes.history.some(step => isRemoveTermChangeType(step.changeType)) || lhsRes.history.some(step => isRemoveTermChangeType(step.changeType))
    if (hasAddedTerms || hasRemovedTerms) {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: undefined, // TBD later
      }
    }
    else {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: 'EQ_SIMPLIFY_BOTH',
      }
    }
  }
}
