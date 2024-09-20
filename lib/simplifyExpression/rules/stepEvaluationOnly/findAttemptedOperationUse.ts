import type { MathNode } from 'mathjs'
import { isConstantNode, isOperatorNode, isSymbolNode } from '~/config'
import type { AChangeType } from '~/index'
import { parseText } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import { getAnswerFromStep } from '~/simplifyExpression/stepEvaluationHelpers'

interface Term {
  type: 'operator' | 'term'
  value: string
  index: number
  count?: number
}

export default function escapeStringRegexp(string: string) {
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d')
}
/**
 * Flatten the AST and track the index of each term/operator within the original string.
 * @param node The AST node to flatten.
 */
function flattenAST(node: MathNode): Term[] {
  const terms: Term[] = []
  let currentIndex = 0

  function traverse(n: MathNode): void {
    if (isOperatorNode(n)) {
      // For binary operators, traverse the left argument first, then the operator, then the right argument
      if (n.args.length === 2) {
        traverse(n.args[0]) // Left operand
        terms.push({ type: 'operator', value: n.op, index: currentIndex })
        currentIndex += n.op.length
        traverse(n.args[1]) // Right operand
      }
      // For unary operators, handle them as needed
      else if (n.args.length === 1) {
        terms.push({ type: 'operator', value: n.op, index: currentIndex })
        currentIndex += n.op.length
        traverse(n.args[0]) // Operand
      }
    }
    else if (isConstantNode(n) || isSymbolNode(n)) {
      const termStr = n.toString()
      terms.push({ type: 'term', value: termStr, index: currentIndex })
      currentIndex += termStr.length
    }
  }

  traverse(node)
  return terms
}


/**
 * Count the occurrences of each term or operator.
 * @param terms Array of terms/operators from the flattened AST.
 */
function countTerms(terms: Term[]): (Term & { count: number })[] {
  const counts: Record<string, number> = {}
  for (const { type, value } of terms) {
    const key = `${type}:${value}`
    counts[key] = (counts[key] || 0) + 1
  }
  return terms.map((term) => {
    term.count = counts[`${term.type}:${term.value}`]
    return term
  }) as (Term & { count: number })[]
}


/**
 * Calculate the differences between two sets of terms (removed/added terms),
 * handling index shifting due to removals and additions.
 * @param fromTerms The original set of terms.
 * @param toTerms The updated set of terms.
 * @returns An object with the added and removed terms.
 */
function getTermDifferences(fromTerms: Term[], toTerms: Term[]) {
  const removedTerms: { term: Term }[] = []
  const addedTerms: { term: Term }[] = []

  let fromIndex = 0
  let toIndex = 0

  // Iterate over both arrays in sequence to detect changes
  while (fromIndex < fromTerms.length || toIndex < toTerms.length) {
    const fromTerm = fromTerms[fromIndex]
    const toTerm = toTerms[toIndex]

    if (fromTerm && toTerm && fromTerm.value === toTerm.value) {
      // Terms are the same, move to the next term in both
      fromIndex++
      toIndex++
    }
    else if (fromTerm && (!toTerm || fromTerm.value !== toTerm.value)) {
      // Term was removed from `toTerms`
      removedTerms.push({ term: fromTerm })
      fromIndex++
    }
    else if (toTerm && (!fromTerm || fromTerm.value !== toTerm.value)) {
      // Term was added in `toTerms`
      addedTerms.push({ term: toTerm })
      toIndex++
    }
  }

  return {
    added: addedTerms,
    removed: removedTerms,
  }
}


/**
 * Correct operation signs based on the removed terms and the operator found.
 * @param removed1 First removed term.
 * @param removed2 Second removed term.
 * @param opFound The operator that was used.
 */
function correctMinusSigns(removed1: string, removed2: string, opFound: string): string {
  const is1Negative = removed1.includes('-')
  const is2Negative = removed2.includes('-')
  const isNeitherNegative = !is1Negative && !is2Negative
  const isBothNegative = is1Negative && is2Negative
  const isOnly1Negative = (is1Negative && !is2Negative) || (!is1Negative && is2Negative)

  let opPerformed: string | null = null
  if (opFound === '*' || opFound === '/' || isNeitherNegative) {
    opPerformed = opFound
  }
  else if (opFound === '+' && isBothNegative) {
    opPerformed = '+'
  }
  else if (opFound === '+' && isOnly1Negative) {
    opPerformed = '-'
  }
  else {
    throw new Error(`Unexpected state. Operator: ${opFound}`)
  }

  return opPerformed
}

/**
 * Get the change type (addition, subtraction, multiplication, etc.).
 * @param operator The operator used in the operation.
 */
function getChangeType(operator: string): AChangeType {
  const map: Record<string, AChangeType> = {
    '+': 'SIMPLIFY_ARITHMETIC__ADD',
    '-': 'SIMPLIFY_ARITHMETIC__SUBTRACT',
    '*': 'SIMPLIFY_ARITHMETIC__MULTIPLY',
    '/': 'SIMPLIFY_ARITHMETIC__DIVIDE',
  } as const
  return map[operator]
}
function dealWithNumberTimesVarTerms(terms: Term[]) {
  // If we have a number times a variable term, we need to combine them, and fix the indexs after that
  for (let i = 0; i < terms.length; i++) {
    if (terms[i].type === 'term' && terms[i + 1]?.type === 'operator' && terms[i + 2]?.type === 'term' && terms[i + 2]?.value.match(/[a-zA-Z]/)) {
      terms[i].value = terms[i].value + terms[i + 2].value
      terms.splice(i + 1, 2)
      // fix the indexes after
      for (let j = i + 1; j < terms.length; j++) {
        terms[j].index = j
      }
    }
  }
  return terms
}

function dealWithMinusAndNegativeTerms(terms: Term[]) {
  // If we have a - number we need to make it -number
  for (let i = 0; i < terms.length; i++) {
    if (terms[i - 1]?.type === 'term' && (terms[i].type === 'operator' && terms[i].value === '-') && terms[i + 1]?.type === 'term' && !terms[i + 1]?.value.includes('-')) {
      terms[i + 1].value = `${terms[i].value}${terms[i + 1].value}`
      terms[i] = { type: 'operator', value: '+', index: terms[i].index }
      // fix the indexes after
      for (let j = i; j < terms.length; j++) {
        terms[j].index = j
      }
    }
  }
  return terms
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


  const fromTerms: Term[] = countTerms(dealWithMinusAndNegativeTerms(dealWithNumberTimesVarTerms(flattenAST(fromAST).sort((a, b) => a.index! - b.index!))))
  const toTerms: Term[] = countTerms(dealWithMinusAndNegativeTerms(dealWithNumberTimesVarTerms(flattenAST(toAST).sort((a, b) => a.index! - b.index!))))
  const fromNoOps = fromTerms.filter(term => term.type === 'term')
  const toNoOps = toTerms.filter(term => term.type === 'term')


  if (fromNoOps.length !== toNoOps.length + 1)
    return null

  // if the values removed are unique(1 occurrence in from) then we know the two terms that were removed.
  const simpleCompareFn = (a: Term[], b: Term[]) => {
    // First find the terms that were removed
    let removedTerms = a.filter(item => (item.count === 1 && !b.some(bItem => bItem.value === item.value)))
    const addedTerms = b.filter(item => item.count === 1 && !a.some(aItem => aItem.value === item.value))
    if (removedTerms.length !== 2 || addedTerms.length !== 1)
      return null
    const opIndex = removedTerms[0].index + 1
    const op = a.find(item => item.index === opIndex)
    if (!op || op.type !== 'operator')
      return null

    // add the operator to the removed terms
    removedTerms.push(op)
    removedTerms = removedTerms.sort((a, b) => a.index - b.index)

    // temp do this
    const removed = removedTerms.map(term => ({ term }))
    const added = addedTerms.map(term => ({ term }))
    return { removed, added }
  }

  const res = simpleCompareFn(fromTerms, toTerms)
  let removed: { term: Term }[] = []
  let added: { term: Term }[] = []
  if (res?.added.length && res?.removed.length) {
    removed = res.removed
    added = res.added
  }
  else {
    const { removed: tempR2, added: tempA2 } = getTermDifferences(fromTerms, toTerms)
    if (tempR2.length && tempA2.length) {
      removed = tempR2
      added = tempA2
    }
    else {
      return null
    }
  }


  const removedTerms = removed.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index)
  const removedOperators = removed.filter(item => item.term.type === 'operator').sort((a, b) => a.term.index - b.term.index)
  const addedTerms = added.filter(item => item.term.type === 'term').sort((a, b) => a.term.index - b.term.index)

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

  const correctedOp = correctMinusSigns(term1.value, term2.value, removedOp.value)


  return {
    opResult: resultTerm.value,
    removedTerms: [term1.value, term2.value],
    changeType: getChangeType(correctedOp),
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
