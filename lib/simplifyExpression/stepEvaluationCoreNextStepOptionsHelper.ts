import mathsteps, { parseText } from '~/index'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { findAllOperationsThatCanBeRemoved } from '~/newServices/nodeServices/termRemovalOperations'
import { getValidStepEqCache } from '~/simplifyExpression/equationCache'
import { mistakeSearches } from '~/simplifyExpression/mistakes/regexPemdasMistakes'
import type { ProcessedStep, RawStep } from '~/simplifyExpression/stepEvaluationCore'
import { getOtherSideOptions } from '~/simplifyExpression/stepEvaluationEquationHelpers'
import { ChangeTypes } from '~/types/changeType/ChangeTypes'
import { filterUniqueValues } from '~/util/arrayUtils'
import { cleanString } from '~/util/stringUtils'

const { SIMPLIFY_ARITHMETIC__ADD, SIMPLIFY_ARITHMETIC__SUBTRACT } = ChangeTypes

const expressionEquals = (exp0: string, exp1: string): boolean => areExpressionEqual(exp0, exp1, getValidStepEqCache())


// Utility function to clean and normalize strings for comparison
function _normalizeExpressionForCountingSubtractions(expr: string) {
  return expr
    .replace(/\+-/g, '-') // Replace +- with -
    .replace(/-\+/g, '-') // Replace -+ with -
    .replace(/--/g, '+') // Replace -- with +
    .replace(/^-/, '') // Remove leading minus for counting purposes. This is so that it doesn't count as a subtraction.
}

/**
 * @description Mathstep rules handle subtraction as + -. To handle this, we need to check if SIMPLIFY_ARITHMETIC__ADD is being used to simplify a +- expression. The trick/hack used here is to count the number of SUBTRACTIONS(not negative) in the expression. If the number of subtractions in the 'to' expression is less than the number of subtractions in the 'from' expression, then we can assume that the SIMPLIFY_ARITHMETIC__ADD is actually a subtraction. This is because the SIMPLIFY_ARITHMETIC__ADD rule is used to simplify a +- expression to a - expression. If the number of subtractions in the 'to' expression is less than the number of subtractions in the 'from' expression, then the SIMPLIFY_ARITHMETIC__ADD rule is being used incorrectly.
 *  There could still be edge cases I am not considering at the moment, but this *should* cover most cases.
 * @example (from:5 + -3, to:2) -> (from:5 - 3, to:2) = (changed subtractions == 1) => SIMPLIFY_ARITHMETIC__ADD becomes SIMPLIFY_ARITHMETIC__SUBTRACT
 * @param steps
 */
function _correctSimplifyAdditionToSubtraction(steps: ProcessedStep[]) {
  steps.forEach((step) => {
    if (step.changeType === SIMPLIFY_ARITHMETIC__ADD && step.from.includes('-')) {
      const fromRaw = _normalizeExpressionForCountingSubtractions(step.from) // changes -- to +, and changes +- to -. Also gets rid of leading minus so that it doesn't count as a subtraction.
      const toRaw = _normalizeExpressionForCountingSubtractions(step.to)

      const fromMinusCount = [...fromRaw.matchAll(/-/g)].length
      const toMinusCount = [...toRaw.matchAll(/-/g)].length
      if (toMinusCount < fromMinusCount) {
        step.changeType = SIMPLIFY_ARITHMETIC__SUBTRACT
      }
    }
  })
  const newAvailableChangeTypes = steps.filter(step => !step?.isMistake).map(step => step?.changeType)
  steps.forEach((step) => {
    step.availableChangeTypes = newAvailableChangeTypes
  })
}

/**
 * @description Converts the raw steps('to' are an array) to processed steps('to' is a string). Also removes all duplicates.
 * @param steps "Raw" steps handed back from simplifyExpression
 */
function _convertRawStepsToProcessedStep(steps: RawStep[]): ProcessedStep[] {
  const processedStepsSet = new Set<string>()
  return steps
    .filter(step => step.to)
    .flatMap(step => step.to.map(toStr => ({
      ...step,
      availableChangeTypes: (steps.filter(step => !step?.isMistake).map(step => step?.changeType)), // TODO remove availableChangeTypes from here? We add it again in _addAllAvailableChangeTypesToEachStep
      to: cleanString(toStr),
      from: cleanString(step.from),
    })))
    .filter(step => !processedStepsSet.has(step.to) && processedStepsSet.add(step.to))
    .filter(step => step.to !== step.from)
}
function _addAllAvailableChangeTypesToEachStep(steps: ProcessedStep[]) {
  const availableChangeTypes = steps.filter(step => !step?.isMistake).map(step => step?.changeType)
  steps.forEach((step) => {
    step.availableChangeTypes = availableChangeTypes
  })
}
function _addAllPossibleCorrectTosToEachStep(steps: ProcessedStep[]) {
  const allPossibleCorrectTos = steps.filter(step => !step.isMistake).map(step => step.to)
  steps.forEach((step) => {
    step.allPossibleCorrectTos = allPossibleCorrectTos
  })
}
/* function _sortStepsByChangeType(steps: ProcessedStep[]) {
  // (possibleStep.changeType === 'SIMPLIFY_ARITHMETIC__ADD' || possibleStep.changeType === 'SIMPLIFY_ARITHMETIC__SUBTRACT' || possibleStep.changeType === 'SIMPLIFY_ARITHMETIC__MULTIPLY' || possibleStep.changeType === 'KEMU_DISTRIBUTE_MUL_OVER_ADD' || possibleStep.changeType === 'REMOVE_ADDING_ZERO' || possibleStep.changeType === 'REMOVE_MULTIPLYING_BY_ONE' || possibleStep.changeType === 'SIMPLIFY_FRACTION') {
  const priorityOrderFirstIsFirst = ['SIMPLIFY_ARITHMETIC__ADD', 'SIMPLIFY_ARITHMETIC__SUBTRACT', 'SIMPLIFY_ARITHMETIC__MULTIPLY', 'KEMU_DISTRIBUTE_MUL_OVER_ADD', 'REMOVE_ADDING_ZERO', 'REMOVE_MULTIPLYING_BY_ONE', 'SIMPLIFY_FRACTION']
  return steps.toSorted((a, b) => {
    const aIndex = priorityOrderFirstIsFirst.indexOf(a.changeType)
    const bIndex = priorityOrderFirstIsFirst.indexOf(b.changeType)
    return aIndex - bIndex
  })
} */


interface NeededForEquationChecks {
  otherSide?: string | null | undefined
  history: ProcessedStep[]
}
/**
 * @description Finds all possible next steps for a given user step. This includes steps from the simplifyExpression engine, as well as additional steps that are not caught/placed yet in the simplifyExpression engine. This is an internal procedure and should not be used directly.
 * @param userStep_ The user's step as a string
 * @param neededForEquations Additional information needed for equation checks
 */
export function findAllNextStepOptions(userStep_: string, neededForEquations?: NeededForEquationChecks | undefined | null): ProcessedStep[] {
  const userStep = myNodeToString(parseText(userStep_))
  const potentialSteps: RawStep[] = []
  mathsteps.simplifyExpression({
    expressionAsText: userStep,
    isDebugMode: false,
    getMistakes: true,
    getAllNextStepPossibilities: true,
    onStepCb: (step: RawStep) => potentialSteps.push(step),
  })

  // Convert the raw steps to processed steps, and remove equal 'to' steps.
  const processedSteps = filterUniqueValues(_convertRawStepsToProcessedStep(potentialSteps), (itemA, itemB) => expressionEquals(itemA.to, itemB.to))

  //
  //  Add Additional Steps
  //

  // Equation checks
  if (neededForEquations?.otherSide && neededForEquations?.history) {
    const removedDepth = neededForEquations.history.filter(step => step.removeNumberOp).map(step => step.removeNumberOp).length
    const addedDepth = neededForEquations.history.filter(step => step.addedNumOp).map(step => step.addedNumOp).length
    if (removedDepth < 2 && addedDepth < 1) {
      processedSteps.push(...findAllOperationsThatCanBeRemoved(userStep_, neededForEquations.history))
    }
    if (removedDepth < 1 && addedDepth < 2) {
      /*  TODO try to use just findAllOperationsThatCanBeRemoved or getOtherSideOptions. Not sure why I ever made two separate completely different versions..
      const useThisVersionLater = findAllOperationsThatCanBeRemoved(neededForEquations.otherSide, neededForEquations.history).map(step => ({
        ...step,
        to: `(${userStep}) ${step?.removeNumberOp?.op} ${step?.removeNumberOp?.number}`,
        removeNumberOp: undefined,
        addedNumOp: step.removeNumberOp,
        changeType: 'EQ_ADD_TERM' as const,
        availableChangeTypes: ['EQ_ADD_TERM' as const],
       }))
       processedSteps.push(...useThisVersionLater) */
      processedSteps.push(...getOtherSideOptions(userStep_, neededForEquations.otherSide, neededForEquations.history))
    }
  }


  // +Mistake Steps that ares not caught by the simplification engine.
  // disabled for equations for now.
  if (!neededForEquations?.otherSide) {
    const manualMistakes = mistakeSearches(userStep)
    processedSteps.push(...manualMistakes)
  }
  // ... Add additional steps from other simplification/error engines here if needed

  //
  // Cleanup and Fixes
  //

  // availableChangeTypes should be the same for all steps
  _addAllAvailableChangeTypesToEachStep(processedSteps)
  // add allPossibleCorrectTos to each step
  _addAllPossibleCorrectTosToEachStep(processedSteps)

  // Correct SIMPLIFY_ARITHMETIC__ADD to SIMPLIFY_ARITHMETIC__SUBTRACT if needed
  _correctSimplifyAdditionToSubtraction(processedSteps)


  // _sortStepsByChangeType(processedSteps)

  return processedSteps
}


