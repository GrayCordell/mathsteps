import type { MathNode, OperatorNode } from 'mathjs'
import { isConstantNode, isOperatorNode, isSymbolNode } from '~/config'

export interface TermTypeAndIndex {
  type: 'operator' | 'term'
  value: string
  index: number
  count?: number
  isInParentheses?: boolean
  parenthesisDepth?: number
  depth?: number
  operationAppliedToTerm?: {
    operation: string | null
    position: string | null
  }
}
export function termToString(terms: TermTypeAndIndex[]): string {
  // Sort terms by index for consistent order
  terms = terms.sort((a, b) => a.index - b.index)

  let lastDepth = 0
  let result = ''
  let openParentheses = 0

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    const nextTerm = terms[i + 1] ?? null
    const currentDepth = term?.parenthesisDepth ?? 0

    // Add opening parentheses if depth increases
    while (currentDepth > lastDepth) {
      result += '('
      openParentheses++
      lastDepth++
    }

    // Add closing parentheses if depth decreases
    while (currentDepth < lastDepth) {
      result += ')'
      openParentheses--
      lastDepth--
    }

    // Add the term value
    result += term.value

    // Add closing parentheses for the last term if necessary
    if (!nextTerm && currentDepth > 0) {
      while (openParentheses > 0) {
        result += ')'
        openParentheses--
      }
    }
  }

  // Add any remaining closing parentheses for unbalanced ones
  while (openParentheses > 0) {
    result += ')'
    openParentheses--
  }

  return result.replace(/\s+/g, '')
}


/**
 * Flatten the AST and track the index of each term/operator within the original string.
 * Also includes the operation applied to each term and their operand positions.
 * TODO is a bit bloated and could be refactored. Attaches lots of information to each term.
 * @param node The AST node to flatten.
 */
export function flattenAndIndexTrackAST(node: MathNode): TermTypeAndIndex[] {
  const terms: TermTypeAndIndex[] = []
  let currentIndex = 0

  interface TraverseParams {
    n: MathNode
    parentOperator?: OperatorNode | null
    operandPosition?: 'left' | 'right' | null
    depth?: number
    parenthesisDepth?: number
    inParentheses?: boolean
  }
  function traverse(
    {
      n,
      parentOperator = null,
      operandPosition = null,
      depth = 0,
      parenthesisDepth = 0,
      inParentheses = false, // Track if current node is within parentheses
    }: TraverseParams,
  ): void {
    const newDepth = depth + 1
    let needsParentheses = false

    if (isOperatorNode(n) && parentOperator) {
      const currentPrecedence = mathNodePrecedence(n)
      const parentPrecedence = mathNodePrecedence(parentOperator)

      // Determine if parentheses are needed based on precedence
      if (
        currentPrecedence < parentPrecedence
        || (currentPrecedence === parentPrecedence && operandPosition === 'right')
      ) {
        needsParentheses = true
        parenthesisDepth++
      }
    }

    // Update the inParentheses flag
    const currentInParentheses = inParentheses || needsParentheses

    if (isOperatorNode(n)) {
      if (n.args.length === 2) {
        traverse({ n: n.args[0], parentOperator: n as OperatorNode | null, operandPosition: 'left', depth: newDepth, inParentheses: currentInParentheses, parenthesisDepth })
        terms.push({
          type: 'operator',
          value: n.op,
          index: currentIndex,
          isInParentheses: currentInParentheses,
          depth: newDepth,
          parenthesisDepth,
        })
        currentIndex += n.op.length
        traverse({ n: n.args[1], parentOperator: n as OperatorNode | null, operandPosition: 'right', depth: newDepth, inParentheses: currentInParentheses, parenthesisDepth })
      }
      else if (n.args.length === 1) {
        terms.push({
          type: 'operator',
          value: n.op,
          index: currentIndex,
          isInParentheses: currentInParentheses,
          depth: newDepth,
          parenthesisDepth,
        })
        currentIndex += n.op.length
        traverse({ n: n.args[0], parentOperator: n as OperatorNode | null, operandPosition: 'left', depth: newDepth, inParentheses: currentInParentheses, parenthesisDepth })
      }
    }
    else if (isConstantNode(n) || isSymbolNode(n)) {
      const termStr = n.toString()
      const operation = parentOperator ? parentOperator.op : null
      terms.push({
        type: 'term',
        value: termStr,
        index: currentIndex,
        isInParentheses: currentInParentheses,
        depth: newDepth,
        parenthesisDepth,
        operationAppliedToTerm: {
          operation,
          position: operandPosition, // 'left' or 'right'
        },
      })
      currentIndex += termStr.length
    }
  }

  traverse({ n: node })
  return terms
}

/**
 * Get the precedence of a MathNode. 0-5, where 5 is the highest precedence.
 * @param node
 */
export function mathNodePrecedence(node: MathNode | string): number {
  if (typeof node === 'string' || isOperatorNode(node)) {
    const precedenceMap: { [key: string]: number } = {
      '^': 4,
      '*': 3,
      '/': 3,
      '+': 2,
      '+-': 2,
      '-': 2,
      '=': 1,
    }

    const op = typeof node === 'string' ? node : node.op
    return precedenceMap[op] || 0
  }
  else {
    // For constants and symbols
    return 5 // Assign highest precedence to constants and symbols
  }
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


function isNumberOrDecimal(value: string) {
  return value.match(/^\d+\.?\d*$/) !== null
}

export function combineNumberVarTimesTerms(terms: TermTypeAndIndex[]) {
  // If we have a number times a variable term, we need to combine them, and fix the indexs after that
  for (let i = 0; i < terms.length; i++) {
    const number = terms[i]
    const operator = terms?.[i + 1]
    const variable = terms?.[i + 2]
    const isVarNotInParenthesis = variable && (variable.depth === number.depth || (variable.depth === number.depth! + 1 && variable.depth === number.depth))


    if (
      number.type === 'term' && isNumberOrDecimal(number.value) // if it is a number
      && operator?.value === '*' && operator.type === 'operator' // and the next term is an operator
      && variable?.type === 'term' && variable?.value.match(/[a-zA-Z]/) // and the (next next) term is a variable
      && (isVarNotInParenthesis)// and the variable is not in parentheses
    ) {
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

// TODO this function is a mess. It needs to be refactored.
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
      // TODO, I am not sure this is working right. This whole function is a mess.
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
 * TODO needs major reworking.
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

