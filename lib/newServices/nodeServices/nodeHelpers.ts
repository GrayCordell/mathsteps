import type { MathNode } from 'mathjs'
import { isConstantNode, isOperatorNode, isSymbolNode } from '~/config'

export interface TermTypeAndIndex {
  type: 'operator' | 'term'
  value: string
  index: number
  count?: number
}

/**
 * Flatten the AST and track the index of each term/operator within the original string.
 * @param node The AST node to flatten.
 */
export function flattenAndIndexTrackAST(node: MathNode): TermTypeAndIndex[] {
  const terms: TermTypeAndIndex[] = []
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
 * Count the occurrences of each term or operator and adds the count to each term.
 * @param terms Array of terms/operators from the flattened AST.
 * @returns The terms array with a count property added to each term.
 */
export function makeCountTerms(terms: TermTypeAndIndex[]): (TermTypeAndIndex & { count: number })[] {
  const counts: Record<string, number> = {}
  for (const { type, value } of terms) {
    const key = `${type}:${value}`
    counts[key] = (counts[key] || 0) + 1
  }
  return terms.map((term) => {
    term.count = counts[`${term.type}:${term.value}`]
    return term
  }) as (TermTypeAndIndex & { count: number })[]
}


/**
 * Calculate the differences between two sets of terms (removed/added terms),
 * handling index shifting due to removals and additions.
 * @param fromTerms The original set of terms.
 * @param toTerms The updated set of terms.
 * @returns An object with the added and removed terms.
 */
export function getTermDifferences(fromTerms: TermTypeAndIndex[], toTerms: TermTypeAndIndex[]) {
  const removedTerms: { term: TermTypeAndIndex }[] = []
  const addedTerms: { term: TermTypeAndIndex }[] = []

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
 * @param removedOp The operator that was used.
 */
export function multiOpMakeNewOp(removed1: string, removed2: string, removedOp: string): string {
  const is1Negative = removed1.includes('-')
  const is2Negative = removed2.includes('-')
  const isNeitherNegative = !is1Negative && !is2Negative
  const isBothNegative = is1Negative && is2Negative
  const isOnly1Negative = (is1Negative && !is2Negative) || (!is1Negative && is2Negative)

  let opPerformed: string | null = null
  if (removedOp === '*' || removedOp === '/' || isNeitherNegative) {
    opPerformed = removedOp
  }
  else if (removedOp === '+' && isBothNegative) {
    opPerformed = '+'
  }
  else if (removedOp === '+' && isOnly1Negative) {
    opPerformed = '-'
  }
  else {
    throw new Error(`Unexpected state. Operator: ${removedOp}`)
  }

  return opPerformed
}


export function combineNumberVarTimesTerms(terms: TermTypeAndIndex[]) {
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

export function combineMakeMinusNegativeTerms(terms: TermTypeAndIndex[]) {
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


// if the values removed are unique(1 occurrence in from) then we know the two terms that were removed.
/* export function simpleCompareTerms(a: TermTypeAndIndex[], b: TermTypeAndIndex[]) {
  // First find the terms that were removed
  let removedTerms = a
    .filter(item => (item.count === 1 && !b.some(bItem => bItem.value === item.value)))
    .filter(item => item.type === 'term')
  const addedTerms = b
    .filter(item => item.count === 1 && !a.some(aItem => aItem.value === item.value))
    .filter(item => item.type === 'term')

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
} */
// if the values removed are unique(1 occurrence in from) then we know the two terms that were removed.
export function simpleCompareTerms(a: TermTypeAndIndex[], b: TermTypeAndIndex[]) {
  const issues: ('NO_2_REMOVED_OR_NOT_1_ADDED' | 'NO_OP')[] = []
  // First find the terms that were removed
  const removedTerms = a
    .filter(item => (item.count === 1 && !b.some(bItem => bItem.value === item.value)))
    .filter(item => item.type === 'term')
  const addedTerms = b
    .filter(item => item.count === 1 && !a.some(aItem => aItem.value === item.value))
    .filter(item => item.type === 'term')

  if (removedTerms.length !== 2 || addedTerms.length !== 1) {
    issues.push('NO_2_REMOVED_OR_NOT_1_ADDED' as const)
  }
  const opIndex = removedTerms[0].index + 1
  const op = a.find(item => item.index === opIndex)
  if (!op || op.type !== 'operator')
    issues.push('NO_OP' as const)

  // add the operator to the removed terms
  if (op && op.type === 'operator') {
    removedTerms.push(op)
  }

  // temp do this
  const removed = removedTerms.map(term => ({ term })).sort((a, b) => a.term.index - b.term.index)
  const added = addedTerms.map(term => ({ term })).sort((a, b) => a.term.index - b.term.index)
  const theSingleOperatorFound = op ? { term: op } : null
  return { removed, added, issues, theSingleOperatorFound }
}
