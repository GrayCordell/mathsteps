import type { MathNode } from 'mathjs'
import type { AChangeType } from '~/index'
import { parseText } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import type { TermTypeAndIndex } from '~/newServices/nodeServices/nodeHelpers'
import { combineMakeMinusNegativeTerms, combineNumberVarTimesTerms, flattenAndIndexTrackAST, getTermDifferences, makeCountTerms, multiOpMakeNewOp, simpleCompareTerms } from '~/newServices/nodeServices/nodeHelpers'


import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers'
import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'
import { getSimplifyChangeTypeByOp } from '~/types/changeType/changeAndMistakeUtils'


function getAddedAndRemovedTerms(fromTerms: any, toTerms: any) {
  const simpleCompared = simpleCompareTerms(fromTerms, toTerms)
  let removed: { term: TermTypeAndIndex }[] = []
  let added: { term: TermTypeAndIndex }[] = []
  if (simpleCompared.added.length > 0 && simpleCompared.removed.length > 0 && simpleCompared.issues.length === 0) {
    removed = simpleCompared.removed
    added = simpleCompared.added
  }
  else {
    const { removed: tempRemoved, added: tempAdded } = getTermDifferences(fromTerms, toTerms)
    if (tempRemoved.length && tempAdded.length) {
      removed = tempRemoved
      added = tempAdded
    }
    else {
      return null
    }
  }
  added = added.sort((a, b) => a.term.index - b.term.index)
  removed = removed.sort((a, b) => a.term.index - b.term.index)
  return { removed, added }
}


/**
 * @description Find what operation (Add, Subtract, Multiply, or Divide) was attempted by the user and construct the full attempted operation result.
 * This function is fairly naive. It still does not handle moved around terms. Its mostly just positional or if the removed&added terms are unique. I wanted it to be simply based on removing of terms but it was having issues. TODO: IMPROVE
 * @param from The previous step or expression that the user started with. ex. '5 + 3'
 * @param to The next step or expression that the user tried to perform. ex. '8'
 */
export function findAttemptedOperationUseCore(
  from: MathNode | string,
  to: MathNode | string,
): { readonly changeType: AChangeType, opResult: string, removedTerms: string[], fullAttemptedOpResult: string } | null {
  const fromStr = typeof from === 'string' ? from : myNodeToString(from)
  const toStr = typeof to === 'string' ? to : myNodeToString(to)


  const fromAST: MathNode = typeof from === 'string' ? parseText(from) : parseText(fromStr!)
  const toAST: MathNode = typeof to === 'string' ? parseText(to) : parseText(toStr!)


  const fromTerms: TermTypeAndIndex[] = makeCountTerms(combineMakeMinusNegativeTerms(combineNumberVarTimesTerms(flattenAndIndexTrackAST(fromAST).sort((a, b) => a.index! - b.index!))))
  const toTerms: TermTypeAndIndex[] = makeCountTerms(combineMakeMinusNegativeTerms(combineNumberVarTimesTerms(flattenAndIndexTrackAST(toAST).sort((a, b) => a.index! - b.index!))))
  const fromNoOps = fromTerms.filter(term => term.type === 'term')
  const toNoOps = toTerms.filter(term => term.type === 'term')


  if (fromNoOps.length !== toNoOps.length + 1)
    return null

  const res = getAddedAndRemovedTerms(fromTerms, toTerms)

  const removedTerms = res?.removed.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index) || []
  const removedOperators = res?.removed.filter(item => item.term.type === 'operator').sort((a, b) => a.term.index - b.term.index) || []
  const addedTerms = res?.added.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index) || []

  // Check for division operators and variables
  const hasDivisionOp = removedOperators.some(op => op.term.value === '/')
  const hasVariables = removedTerms.some(term => /[a-zA-Z]/.test(term.term.value))
  const hasDivisionOrVariables = hasDivisionOp || hasVariables

  if (((hasVariables && addedTerms.length > 2) // TODO: Should be 1, currently breaking on variables
    || (!hasVariables && addedTerms.length > 1) // No variables, only 1 term should be added
    || (removedOperators.length > 1 && !hasDivisionOrVariables) // More than 1 operator without division/variables
    || (removedOperators.length > 2 && hasDivisionOrVariables) // More than 2 operators with division/variables
    || (hasVariables && removedTerms.length > 3) // TODO: Should be 2, currently breaking on variables
    || (!hasVariables && removedTerms.length > 2) // No variables, only 2 terms should be removed
    || removedTerms.length === 0 // At least 1 term must be removed
  )) {
    return null
  }

  const term1 = removedTerms[0].term
  const term2 = removedTerms[1]?.term ?? term1
  const resultTerm = addedTerms[0].term
  const removedOp = removedOperators[0].term


  // Replace the first occurrence of term1 and term2 with the resultTerm in the original string


  const actuallyCorrectTerm = getAnswerFromStep(`${term1.value} ${removedOp.value} ${term2.value}`)
  const fullAttemptedOpResult = toTerms.map((term) => {
    if (term.type === 'term' && term.value === resultTerm.value && resultTerm.index === term.index)
      return { ...term, value: actuallyCorrectTerm }
    return term
  }).map(term => term.value).join('')

  const correctedOp = multiOpMakeNewOp(term1.value, term2.value, removedOp.value)


  return {
    opResult: resultTerm.value,
    removedTerms: [term1.value, term2.value],
    changeType: getSimplifyChangeTypeByOp(correctedOp as AOperator),
    fullAttemptedOpResult,
  }
}


interface findAttemptedOperationUseArgs {
  from: string | MathNode
  to: string | MathNode
  expressionEquals: { (a: string, b: string): boolean }
  allPossibleNextStep: { changeType: AChangeType }[]
  allPossibleCorrectTos: string[]
}
export function findAttemptedOperationUse({ from, to, expressionEquals, allPossibleNextStep, allPossibleCorrectTos }: findAttemptedOperationUseArgs): ProcessedStep | null {
  const fromStr = typeof from === 'string' ? from : myNodeToString(from)
  const toStr = typeof to === 'string' ? to : myNodeToString(to)
  const findWhatOpRes = findAttemptedOperationUseCore(fromStr, toStr)
  if (!findWhatOpRes)
    return null

  const { changeType, fullAttemptedOpResult } = findWhatOpRes
  const isMistake = !expressionEquals(fullAttemptedOpResult, toStr)

  // TODO should mistakeType be unknown?
  return { from: fromStr, to: toStr, changeType, attemptedToGetTo: fullAttemptedOpResult, /* mistakenChangeType: 'UNKNOWN', */ isMistake, mTo: [], availableChangeTypes: allPossibleNextStep.map(step => step.changeType), attemptedChangeType: changeType, allPossibleCorrectTos }
}
