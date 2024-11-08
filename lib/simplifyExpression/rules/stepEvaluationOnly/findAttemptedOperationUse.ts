import type { MathNode } from 'mathjs'
import type { AChangeType } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import type { TermTypeAndIndex } from '~/newServices/nodeServices/nodeHelpers'
import { combineMakeMinusNegativeTerms, combineNumberVarTimesTerms, flattenAndIndexTrackAST, getAddedAndRemovedTerms, makeCountTerms } from '~/newServices/nodeServices/nodeHelpers'
import { parseText } from '~/newServices/nodeServices/parseText'


import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers'
import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'
import { getSimplifyChangeTypeByOp } from '~/types/changeType/changeAndMistakeUtils'


/**
 * Correct operation signs based on the removed terms and the operator found. Required because of the way we handle subtraction throughout the system.(+- -> -)
 * @param removed1 First removed term.
 * @param removed2 Second removed term.
 * @param removedOp The operator that was used.
 */
function applyOpFixBasedOnTermRemovals(removed1: string, removed2: string, removedOp: AOperator): AOperator {
  const is1Negative = removed1.includes('-')
  const is2Negative = removed2.includes('-')
  const isNeitherNegative = !is1Negative && !is2Negative
  const isBothNegative = is1Negative && is2Negative
  const isOnly1Negative = (is1Negative && !is2Negative) || (!is1Negative && is2Negative)

  let opPerformed: string | null = null
  if (removedOp === '*' || removedOp === '/' || isNeitherNegative)
    opPerformed = removedOp
  else if (removedOp === '+' && isBothNegative)
    opPerformed = '+'
  else if (removedOp === '+' && isOnly1Negative)
    opPerformed = '-'
  else
    throw new Error(`Unexpected state. Operator: ${removedOp}`)

  return opPerformed as AOperator
}

/**
 * Parses an expression string into an array of normalized terms.
 * @param expr - The expression string to parse.
 * @returns An array of normalized terms with indices.
 */
function _parseExpression(expr: string): (TermTypeAndIndex & { count: number })[] {
  const ast = parseText(expr)
  const flattenedTerms = flattenAndIndexTrackAST(ast).sort((a, b) => a.index! - b.index!)
  const combinedTerms = combineNumberVarTimesTerms(flattenedTerms)
  const normalizedTerms = combineMakeMinusNegativeTerms(combinedTerms)
  return makeCountTerms(normalizedTerms)
}


function earlyIsValidOperation(fromTerms: TermTypeAndIndex[], toTerms: TermTypeAndIndex[]): boolean {
  const fromHasDivisionOp = fromTerms.some(term => term.type === 'operator' && term.value === '/')
  const toHasDivisionOp = toTerms.some(term => term.type === 'operator' && term.value === '/')
  const fromHasMultOp = fromTerms.some(term => term.type === 'operator' && term.value === '*')
  const toHasMultOp = toTerms.some(term => term.type === 'operator' && term.value === '*')

  if (!fromHasDivisionOp && toHasDivisionOp) // can't invent a new division out of nowhere.. I think?
    return false
  if (!fromHasMultOp && toHasMultOp) // can't invent a new multiplication out of nowhere.. I think?
    return false

  const fromNoOps = fromTerms.filter(term => term.type === 'term')
  const toNoOps = toTerms.filter(term => term.type === 'term')

  if (fromNoOps.length !== toNoOps.length + 1)
    return false

  return true
}

/**
 * Validates whether the found results are allowed based on terms and operator.
 */
function isValidOperation(useOperators: { term: TermTypeAndIndex }[], removedNoOpTerms: { term: TermTypeAndIndex }[], addedNoOpTerms: { term: TermTypeAndIndex }[], removedOperators: { term: TermTypeAndIndex }[]): boolean {
  // Check for division operators and variables
  const hasDivisionOp = useOperators.some(op => op.term.value === '/')
  const hasVariables = removedNoOpTerms.some(term => /[a-zA-Z]/.test(term.term.value))
  const hasDivisionOrVariables = hasDivisionOp || hasVariables


  if (((hasVariables && addedNoOpTerms.length > 2) // TODO: Should be 1, currently breaking on variables
    || (!hasVariables && addedNoOpTerms.length > 1) // No variables, only 1 term should be added
    || (removedOperators.length > 1 && !hasDivisionOrVariables) // More than 1 operator without division/variables
    || (removedOperators.length > 2 && hasDivisionOrVariables) // More than 2 operators with division/variables
    || (hasVariables && removedNoOpTerms.length > 3) // TODO: Should be 2, currently breaking on variables
    || (!hasVariables && removedNoOpTerms.length > 2) // No variables, only 2 terms should be removed
    || removedNoOpTerms.length === 0 // At least 1 term must be removed
  )) {
    return false
  }
  else {
    return true
  }
}

/**
 * @description Find what operation (Add, Subtract, Multiply, or Divide) was attempted by the user and construct the full attempted operation result.
 * This function is fairly naive. It still does not handle moved around terms. Its mostly just positional or if the removed&added terms are unique. I wanted it to be simply based on removing of terms but it was having issues. TODO: IMPROVE
 * @param from The previous step or expression that the user started with. ex. '5 + 3'
 * @param to The next step or expression that the user tried to perform. ex. '8'
 * TODO. This function is not perfect. It is a work in progress.. I am having a hard time figuring out how to do this. I also am handling edge cases a little too directly.
 */
export function findAttemptedOperationUseCore(
  from: MathNode | string,
  to: MathNode | string,
): { readonly changeType: AChangeType, opResult: string, removedTerms: string[], fullAttemptedOpResult: string } | null {
  const fromStr = typeof from === 'string' ? from : myNodeToString(from)
  const toStr = typeof to === 'string' ? to : myNodeToString(to)

  // Parse expressions into "terms" (operators and numbers/numberVariables/negativeNumbers). Each term has an index and a count of how many times that value appears.
  const fromTerms = _parseExpression(fromStr)
  const toTerms = _parseExpression(toStr)

  if (!earlyIsValidOperation(fromTerms, toTerms))
    return null

  const { removed, added, opFound = null } = getAddedAndRemovedTerms(fromTerms, toTerms)

  const removedNoOpTerms = removed.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index) || []
  const addedNoOpTerms = added?.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index) || []
  const removedOperators = removed?.filter(item => item.term.type === 'operator').sort((a, b) => a.term.index - b.term.index) || []
  const useOperators = [opFound, ...removedOperators].filter(op => op) as { term: TermTypeAndIndex }[] // Utilizes the found operator first.

  if (!isValidOperation(useOperators, removedNoOpTerms, addedNoOpTerms, removedOperators))
    return null

  const removedTerm1 = removedNoOpTerms[0].term
  const removedTerm2 = removedNoOpTerms[1]?.term ?? removedTerm1
  const resultTerm = addedNoOpTerms[0].term
  const useOp = useOperators[0].term

  // Get the actual "correct" result of the operation had they done it correctly. Currently this includes incorrect things like 5/2 + 3 -> 5 + 5 -> op performed is seen as + so the correct result is 2 + 3-> 5 + 5
  const termOperationFromSystem = getAnswerFromStep(`${removedTerm1.value} ${useOp.value} ${removedTerm2.value}`)
  let fullAttemptedOpResult = toTerms.map((term) => {
    return term.type === 'term' && term.value === resultTerm.value && resultTerm.index === term.index
      ? { ...term, value: termOperationFromSystem }
      : term
  }).map(term => term.value).join('')
  // TODO bad quick fix
  fullAttemptedOpResult = fullAttemptedOpResult.replace(/^--/g, '-')


  return {
    opResult: resultTerm.value,
    removedTerms: [removedTerm1.value, removedTerm2.value],
    fullAttemptedOpResult,
    // Fix operators we use based on num + - num specifically for getting the changeType.
    changeType: getSimplifyChangeTypeByOp(applyOpFixBasedOnTermRemovals(removedTerm1.value, removedTerm2.value, useOp.value as AOperator)),
  }
}


interface findAttemptedOperationUseArgs {
  from: string | MathNode
  to: string | MathNode
  expressionEquals: { (a: string, b: string): boolean }
}

export function findAttemptedOperationUse({ from, to, expressionEquals }: findAttemptedOperationUseArgs): (Omit<ProcessedStep, 'mTo' | 'availableChangeTypes' | 'allPossibleCorrectTos'> & { removedTerms: string[] }) | null {
  const fromStr = typeof from === 'string' ? from : myNodeToString(from)
  const toStr = typeof to === 'string' ? to : myNodeToString(to)
  const findWhatOpRes = findAttemptedOperationUseCore(fromStr, toStr)
  if (!findWhatOpRes)
    return null

  const { changeType, fullAttemptedOpResult } = findWhatOpRes
  const isMistake = !expressionEquals(fullAttemptedOpResult, toStr)

  // TODO should mistakeType be unknown?
  return {
    removedTerms: findWhatOpRes.removedTerms,
    from: fromStr,
    to: toStr,
    changeType,
    attemptedToGetTo: fullAttemptedOpResult,
    /* mistakenChangeType: 'UNKNOWN', */
    isMistake,
    // mTo: [],
    // availableChangeTypes: allPossibleNextStep.map(step => step.changeType),
    attemptedChangeType: changeType,
    // allPossibleCorrectTos,
  }
}
