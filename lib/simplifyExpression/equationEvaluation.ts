import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import type { CoreAssessUserStepResult, StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { _coreAssessUserStep, getValidStepEqCache, processNoHistoryStep, processStep } from '~/simplifyExpression/stepEvaluationCore'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { EqualityCache } from '~/util/equalityCache'
import { cleanString } from '~/util/stringUtils'

const validStepEqCache = getValidStepEqCache() || new EqualityCache()
const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, validStepEqCache)

function processEquationInfo(
  res: { lhs: CoreAssessUserStepResult, rhs: CoreAssessUserStepResult, equationChangeType: any },
  previousStep: string,
  userStep: string,
  startingStepAnswer: string,
  logs: any,
): [StepInfo[], StepInfo[]] {
  const leftPrevious = cleanString(previousStep.split('=')[0])
  const rightPrevious = cleanString(previousStep.split('=')[1])
  const userLeft = cleanString(userStep.split('=')[0])
  const userRight = cleanString(userStep.split('=')[1])


  if (res.equationChangeType === 'NO_CHANGE') {
    const rightRes = processNoHistoryStep(rightPrevious, userRight, startingStepAnswer, logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog)
    const leftRes = processNoHistoryStep(leftPrevious, userLeft, startingStepAnswer, logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog)
    return [leftRes, rightRes]
  }
  if (res.rhs.history.length === 0) {
    const leftHistory = res.lhs.history.map(step => processStep(step, leftPrevious, startingStepAnswer, res.lhs.history.length))

    const stayedSameValue: StepInfo = processNoHistoryStep(rightPrevious, userRight, startingStepAnswer, logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog)[0]
    // make same amount of steps as left
    const rightRes: StepInfo[] = []
    for (let i = 0; i < leftHistory.length; i++)
      rightRes.push(stayedSameValue)

    return [leftHistory, rightRes]
  }
  if (res.lhs.history.length === 0) {
    const rightHistory = res.rhs.history.map(step => processStep(step, rightPrevious, startingStepAnswer, res.rhs.history.length))
    const stayedSameValue = processNoHistoryStep(leftPrevious, userLeft, startingStepAnswer, logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog)[0]
    // make same amount of steps as right
    const leftRes: StepInfo[] = []
    for (let i = 0; i < rightHistory.length; i++)
      leftRes.push(stayedSameValue)
    return [leftRes, rightHistory]
  }
  if (res.equationChangeType === 'SWAP_SIDES') {
    const leftRes = res.lhs.history.map(step => processStep(step, leftPrevious, startingStepAnswer, res.lhs.history.length))
    const rightRes = res.rhs.history.map(step => processStep(step, rightPrevious, startingStepAnswer, res.rhs.history.length))
    // make changeType SWAP_SIDES
    leftRes[0].attemptedChangeType = 'SWAP_SIDES'
    leftRes[0].equationActionType = 'SWAP_SIDES'
    rightRes[0].attemptedChangeType = 'SWAP_SIDES'
    rightRes[0].equationActionType = 'SWAP_SIDES'
    // make isValid true
    leftRes[0].isValid = true
    rightRes[0].isValid = true

    return [leftRes, rightRes]
  }

  const rRemovedFrom = { lhs: false, rhs: false }
  const lRemovedFrom = { lhs: false, rhs: false }
  const rAddedTo = { lhs: false, rhs: false }
  const lAddedTo = { lhs: false, rhs: false }
  res.lhs.history.forEach((step) => {
    // const left = processStep(step, leftPrevious, startingStepAnswer)
    if (step.sideCheckNumOp) {
      rAddedTo.lhs = true
    }
    else if (step.equationActionType === 'REMOVE_TERM') {
      rRemovedFrom.lhs = true
    }
  })
  res.rhs.history.forEach((step) => {
    // const right = processStep(step, rightPrevious, startingStepAnswer)
    if (step.sideCheckNumOp) {
      lAddedTo.rhs = true
    }
    else if (step.equationActionType === 'REMOVE_TERM') {
      lRemovedFrom.rhs = true
    }
  })


  const resLeft = res.lhs.history.map(step => processStep(step, leftPrevious, startingStepAnswer, res.lhs.history.length))
  const resRight = res.rhs.history.map(step => processStep(step, rightPrevious, startingStepAnswer, res.rhs.history.length))

  function makeItemInvalidIfEquationActionType(arr: StepInfo[], value: string) {
    return arr.map((step) => {
      if (step.equationActionType === value)
        return { ...step, isValid: false }
      return step
    })
  }
  function makeItemInvalidIfSideCheckNumOp(arr: StepInfo[]) {
    return arr.map((step) => {
      if (step.sideCheckNumOp)
        return { ...step, isValid: false }
      return step
    })
  }

  // if both don't have any added or removed then just return it
  if (!rAddedTo.lhs && !rAddedTo.rhs && !rRemovedFrom.lhs && !rRemovedFrom.rhs) {
    return [resLeft, resRight]
  }

  // if both removedFrom then make them both invalid
  if (lRemovedFrom.lhs && rRemovedFrom.rhs) {
    const resleft2 = makeItemInvalidIfEquationActionType(resLeft, 'REMOVE_TERM')
    const resRight2 = makeItemInvalidIfEquationActionType(resRight, 'REMOVE_TERM')
    return [resleft2, resRight2]
  }
  // if both added to then make them both invalid
  if (lAddedTo.lhs && rAddedTo.rhs) {
    const resleft2 = makeItemInvalidIfSideCheckNumOp(resLeft)
    const resRight2 = makeItemInvalidIfSideCheckNumOp(resRight)
    return [resleft2, resRight2]
  }
  // if one added and one removed then keep them both valid
  if ((lAddedTo.rhs && rRemovedFrom.lhs) || (lRemovedFrom.rhs && rAddedTo.lhs)) {
    // check that the added to is the same
    // const rFoundFirst = resRight.find(step => step.sideCheckNumOp || step.changeType === 'REMOVE_TERM')
    // const lFoundFirst = resLeft.find(step => step.sideCheckNumOp || step.changeType === 'REMOVE_TERM')
    // const lTermChange = lFoundFirst?.sideCheckNumOp || lFoundFirst?.removedTerm
    // const rTermChange = rFoundFirst?.sideCheckNumOp || rFoundFirst?.removedTerm
    // const isTermEqual = (lTermChange.op === rTermChange.op) && (lTermChange.number === rTermChange.number)
    // if (rFoundFirst && lFoundFirst && isTermEqual) {
    //  return [resLeft, resRight]
    // }
    return [resLeft, resRight]
  }
  else {
    throw new Error('Invalid state')
  }
}
export function assessUserEquationStep(previousUserStep: string, userStep: string): [StepInfo[], StepInfo[]] {
  // const startingStepAnswer = getAnswerFromEquation(previousUserStep)
  const logs = {
    lhsFirstChangeTypesLog: [] as AChangeType[],
    rhsFirstChangeTypesLog: [] as AChangeType[],
    lhsFirstFoundToLog: [] as string[],
    rhsFirstFoundToLog: [] as string[],
  }
  const rawAssessedStepOptionsRes = coreAssessUserStepEquation([previousUserStep, userStep], logs)
  return processEquationInfo(rawAssessedStepOptionsRes, previousUserStep, userStep, null, logs)
}
export function assessUserEquationSteps(userSteps: string[]): [StepInfo[], StepInfo[]][] {
  if (userSteps.length === 0)
    return []
  // const userSteps = userSteps_.map(step => myNodeToString(parseText(step)))

  const assessedSteps: [StepInfo[], StepInfo[]][] = []
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
  equationChangeType: any
} {
  const previousEquation = { lhs: cleanString(previousEquationStr.split('=')[0]), rhs: cleanString(previousEquationStr.split('=')[1]) }
  const userEquation = { lhs: cleanString(userEquationStr.split('=')[0]), rhs: cleanString(userEquationStr.split('=')[1]) }

  // Determine the operation applied to the equation
  const lhsUnchanged = expressionEquals(previousEquation.lhs, userEquation.lhs)
  const rhsUnchanged = expressionEquals(previousEquation.rhs, userEquation.rhs)

  if (lhsUnchanged && rhsUnchanged) {
    return {
      lhs: { history: [] },
      rhs: { history: [] },
      equationChangeType: 'NO_CHANGE',
    }
  }

  // Case 1: Swapping sides
  if (
    expressionEquals(previousEquation.lhs, userEquation.rhs)
    && expressionEquals(previousEquation.rhs, userEquation.lhs)
  ) {
    return {
      // @ts-expect-error ---
      lhs: { history: [{ to: previousEquation.rhs, from: previousEquation.lhs, isMistake: false, availableChangeTypes: [], attemptedToGetTo: previousEquation.rhs, attemptedChangeType: 'SWAP_SIDES', allPossibleCorrectTos: [] }] },
      // @ts-expect-error ---
      rhs: { history: [{ to: previousEquation.lhs, from: previousEquation.rhs, isMistake: false, availableChangeTypes: [], attemptedToGetTo: previousEquation.lhs, attemptedChangeType: 'SWAP_SIDES', allPossibleCorrectTos: [] }] },
      equationChangeType: 'SWAP_SIDES',
    }
  }

  function simplifySideCases(equationChangeType: 'SIMPLIFY_LHS' | 'SIMPLIFY_RHS') {
    const rhsRes = _coreAssessUserStep([previousEquation.rhs, userEquation.rhs], logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog)
    const lhsRes = _coreAssessUserStep([previousEquation.lhs, userEquation.lhs], logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog)
    return {
      lhs: lhsRes,
      rhs: rhsRes,
      equationChangeType,
    }
  }

  // Case 2 & 3: Simplifying one side
  if (!lhsUnchanged && rhsUnchanged) {
    return simplifySideCases('SIMPLIFY_LHS')
  }
  else if (lhsUnchanged && !rhsUnchanged) {
    return simplifySideCases('SIMPLIFY_RHS')
  }

  // Case 4 & 5:
  else if (!lhsUnchanged && !rhsUnchanged) {
    const lhsRes = _coreAssessUserStep([previousEquation.lhs, userEquation.lhs], logs.lhsFirstChangeTypesLog, logs.lhsFirstFoundToLog, previousEquation.rhs)
    const rhsRes = _coreAssessUserStep([previousEquation.rhs, userEquation.rhs], logs.rhsFirstChangeTypesLog, logs.rhsFirstFoundToLog, previousEquation.lhs)
    const hasAddedTerms = rhsRes.history.some(step => step.sideCheckNumOp) || lhsRes.history.some(step => step.sideCheckNumOp)
    const hasRemovedTerms = rhsRes.history.some(step => step.equationActionType === 'REMOVE_TERM') || lhsRes.history.some(step => step.equationActionType === 'REMOVE_TERM')


    if (hasAddedTerms || hasRemovedTerms) {
      return {
        lhs: lhsRes,
        rhs: rhsRes,
        equationChangeType: 'SIDE_CHANGES',
      }
    }

    return {
      lhs: lhsRes,
      rhs: rhsRes,
      equationChangeType: 'SIMPLIFY_BOTH',
    }
  }

  // else
  return {
    rhs: { history: [] },
    lhs: { history: [] },
    equationChangeType: 'UNKNOWN',
  }
}
