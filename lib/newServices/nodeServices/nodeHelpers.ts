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
interface TermDifferenceReturn {
  removed: { term: TermTypeAndIndex }[]
  added: { term: TermTypeAndIndex }[]
  issues: ('NO_2_REMOVED_OR_NOT_1_ADDED' | 'NO_OP' | 'TOO_MANY_OPS')[]
  opFound: { term: TermTypeAndIndex } | null
}

export function getTermDifferencesViaRemovals(a: TermTypeAndIndex[], b: TermTypeAndIndex[]): TermDifferenceReturn {
  const issues: ('NO_2_REMOVED_OR_NOT_1_ADDED' | 'NO_OP' | 'TOO_MANY_OPS')[] = []

  const combinedBA_B = [...b]
  for (let i = 0; i < a.length; i++) {
    if (!b.some(item => item.value === a[i].value))
      combinedBA_B.push({ ...a[i], count: 0 })
  }

  const diffBA = combinedBA_B.map((item, index) => {
    const aCount = a.find(aItem => aItem.value === item.value)?.count || 0
    const bCount = b.find(bItem => bItem.value === item.value)?.count || 0
    return {
      ...item,
      diff: bCount - aCount,
    }
  }).sort((a, b) => a.index - b.index)
  const removedTermsFlattened = []
  const addedTermsFlattened = []
  for (let i = 0; i < diffBA.length; i++) {
    if (diffBA[i].diff > 0) {
      for (let j = 0; j < diffBA[i].diff; j++)
        addedTermsFlattened.push(diffBA[i])
    }
    else if (diffBA[i].diff < 0) {
      for (let j = 0; j < -diffBA[i].diff; j++)
        removedTermsFlattened.push(diffBA[i])
    }
  }

  const removedTermsFlattenedNoOp = removedTermsFlattened.filter(item => item.type !== 'operator')
  const addedTermsFlattenedNoOp = addedTermsFlattened.filter(item => item.type !== 'operator')

  if (removedTermsFlattenedNoOp.length !== 2 || addedTermsFlattenedNoOp.length !== 1) {
    issues.push('NO_2_REMOVED_OR_NOT_1_ADDED' as const)
  }
  const removedOps = removedTermsFlattened.filter(item => item.type === 'operator')

  function getRemovedTerm1Index() {
    const removedTerm1Value = removedTermsFlattenedNoOp[0].value
    return a.find(item =>
      // We are getting the removed term1 from the original expression.
      item.value === removedTerm1Value && !b.some(bItem => bItem.value === item.value && bItem.index === item.index)
        ? item.index
        : null,
    )?.index ?? removedTermsFlattenedNoOp[0].index
  }
  const term1Index = getRemovedTerm1Index()

  // Check if there is an operator after the first removed term in the original expression
  const op = (term1Index + 1) ? a.find(item => item.index === (term1Index + 1) && item.type === 'operator') : null
  if (!op || (removedOps.length === 0))
    issues.push('NO_OP' as const)

  // Make our added and removed type be of Type TermTypeAndIndex
  const removed = removedTermsFlattened.map(term => ({ term })).sort((a, b) => a.term.index - b.term.index)
  const added = addedTermsFlattened.map(term => ({ term })).sort((a, b) => a.term.index - b.term.index)
  const opFound = op ? { term: op } : null
  return { removed, added, issues, opFound }
}


/**
 * Calculate the differences between two sets of terms (removed/added terms),
 * handling index shifting due to removals and additions.
 * @param fromTerms The original set of terms.
 * @param toTerms The updated set of terms.
 * @returns An object with the added and removed terms.
 */
export function getTermDifferencesViaIndexChanges(fromTerms: TermTypeAndIndex[], toTerms: TermTypeAndIndex[]) {
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
 * Attempts to use two different methods to find the added and removed terms between two sets of terms. If both methods fail, returns null.
 * @param fromTerms
 * @param toTerms
 */
export function getAddedAndRemovedTerms(fromTerms: TermTypeAndIndex[], toTerms: TermTypeAndIndex[]): Omit<TermDifferenceReturn, 'issues'> {
  const { removed, added, issues, opFound } = getTermDifferencesViaRemovals(fromTerms, toTerms)
  if (added.length > 0 && removed.length > 0 && issues.length === 0) {
    return { removed, added, opFound }
  }
  else {
    const { removed: viaIndexRemoved, added: viaIndexAdded } = getTermDifferencesViaIndexChanges(fromTerms, toTerms)
    return viaIndexRemoved?.length && viaIndexAdded?.length
      ? { removed: viaIndexRemoved, added: viaIndexAdded, opFound: null }
      : { removed: [], added: [], opFound: null }
  }
}
