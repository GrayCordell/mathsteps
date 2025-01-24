import type { MathNode } from 'mathjs'
import { isConstantNode, isOperatorNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'

import { parseText } from '~/newServices/nodeServices/parseText'
import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'
import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'
import { getAddRemoveTermTypeBasedOnOp, getReverseOp } from '~/types/changeType/changeAndMistakeUtils'

import { filterUniqueValues } from '~/util/arrayUtils'
import { cleanString } from '~/util/cleanString'

// type ExpressionEquals = (exp0: MathNode, exp1: MathNode) => boolean
// Helper function to determine if an expression is negative
function isNegative(node: MathNode): boolean {
  if (isOperatorNode(node) && node.isUnary()) {
    return true
  }
  if (isOperatorNode(node) && node.op === '*') {
    // Check if one of the factors is negative
    return node.args.some(
      arg => isConstantNode(arg) && Number.parseFloat(arg.value.toString()) < 0,
    )
  }
  if (isConstantNode(node)) {
    return Number.parseFloat(node.value.toString()) < 0
  }
  return false
}

export interface GeneratedExpression { op: AOperator, term: string, node: MathNode, dfsNodeId: number }

// Function to generate all possible expressions with one term removed
// must be unflattened node
function generateExpressions(
  node: MathNode,
  options: { combinedTermLimit: number } = { combinedTermLimit: 2 },
): GeneratedExpression[] {
  const countTermsFn = (node: MathNode): number => (isOperatorNode(node) && node.args)
    ? node.args.reduce((acc, arg) => acc + countTermsFn(arg), 0)
    : 1


  let dfsNodeId = 0
  function core(node: MathNode): GeneratedExpression[] {
    let expressions: Array<GeneratedExpression> = []
    const operations = ['+', '-', '*', '/', '+-'] // +- should not be here

    if (isOperatorNode(node) && operations.includes(node.op) && node.args.length >= 2) {
      const secondOp = node.op as AOperator
      let firstOp = node.op as AOperator
      if (node.args.length === 2 && firstOp === '-') {
        firstOp = '+'
      }
      expressions.push({
        op: firstOp,
        node: node.args[0],
        term: myNodeToString(node.args[0]),
        dfsNodeId: dfsNodeId++,
      })
      expressions.push({
        op: secondOp,
        node: node.args[1],
        term: myNodeToString(node.args[1]),
        dfsNodeId: dfsNodeId++,
      })
    }

    if (isOperatorNode(node) && node.args) {
      for (const arg of node.args)
        expressions = expressions.concat(core(arg))
    }


    return expressions as GeneratedExpression[]
  }


  ///
  //
  const filterResult = filterUniqueValues(core(node), (a, b) => a.term === b.term && a.op === b.op)
  if (filterResult.length === 0) {
    // see if there is just a single term
    if (isConstantNode(node)) {
      return isNegative(node)
        ? [{ op: '+-', term: myNodeToString(node), node, dfsNodeId: 0 }]
        : [{ op: '+', term: myNodeToString(node), node, dfsNodeId: 0 }]
    }
  }
  return filterResult.filter(item => countTermsFn(item.node) <= options.combinedTermLimit)
}

/**
 * Finds all operations that can be "removed" from an expression.
 * TODO: this function is bad.
 * @param fromNode_
 * @param history - The history of steps leading up to the current expression.
 * @param options
 * @param options.isAdded - If true, the operation is considered to be added.
 */
export function findAllOperationsThatCanBeRemoved(
  fromNode_: MathNode | string,
  history: ProcessedStep[],
  options: { isAdded?: boolean } = {},
): ProcessedStep[] {
  const unFlattenNodeFn = (node: MathNode) => parseText(myNodeToString(node))
  const getNumberOpFn = (step: ProcessedStep) => options.isAdded ? (step?.addedNumOp || step?.removeNumberOp) : (step?.removeNumberOp || step?.addedNumOp)

  const fromNodeNode = typeof fromNode_ === 'string' ? parseText(fromNode_) : unFlattenNodeFn(fromNode_) // have to unflatten because generate requires it.
  const fromNodeString = typeof fromNode_ === 'string' ? cleanString(fromNode_) : myNodeToString(fromNodeNode)

  const previousRemovedNumOps = history.filter(step => getNumberOpFn(step)).map(step => getNumberOpFn(step))
  const flippedPreviousReverseNumOps = previousRemovedNumOps.map(numOp => ({ number: numOp!.number, op: getReverseOp(numOp!.op) }))

  let termOps = generateExpressions(fromNodeNode)
  termOps = filterUniqueValues(termOps, (a, b) => a.term === b.term && a.op === b.op)
  // remove all terms that have been removed before
  termOps = termOps.filter(term => !flippedPreviousReverseNumOps.some(prev => prev.number === term.term && prev.op === term.op))
  // ignore + or - 0
  termOps = termOps.filter(term => term.term !== '0')
  termOps = filterUniqueValues(termOps, (a, b) => a.term === b.term && a.op === b.op)


  const newTermStrings = termOps
  .map(termOp =>{
    const fn = (str: string) => ['+', '-', '*', '/','^','(',')'].some(op => str.includes(op))
    let tempFrom = fn(fromNodeString) ? `(${fromNodeString})` : fromNodeString  // ex (fromTerm+fromTerm) or fromTerm
    const tempTerm = fn(termOp.term) ? `(${termOp.term})` : termOp.term // ex. (term+term) or term
    return `${tempFrom} ${getReverseOp(termOp.op)} ${tempTerm}` // ex. (previous expression) - (term)
  })



  return termOps
    .map((term, index) => ({ removeNumberOp: { number: term.term, op: term.op, dfsNodeId: term.dfsNodeId }, newExpression: newTermStrings[index] })) // map to the correct format
    .filter(term => term.removeNumberOp.number !== undefined && term.removeNumberOp.op !== undefined && term.newExpression !== undefined) // filter out terms with missing values
    .map(term => ({ // map to the correct format
      from: fromNodeString,
      to: term.newExpression,
      changeType: getAddRemoveTermTypeBasedOnOp(getReverseOp(term.removeNumberOp.op), options.isAdded ? 'add' : 'remove'),
      isMistake: false,
      removeNumberOp: { ...term.removeNumberOp, op: getReverseOp(term.removeNumberOp.op), number: term.removeNumberOp.number },
      availableChangeTypes: ['EQ_REMOVE_TERM' as const],
    }))
}


// can give back operation as +-
/* export function findTermRemovalOperation(
  fromNode_: MathNode | string,
  toMathNode_: MathNode | string,
  expressionEquals: ExpressionEquals = areExpressionEqual,
): NumberOp | null {
  const fromNode = typeof fromNode_ === 'string' ? parseText(fromNode_) : fromNode_
  const toMathNode = typeof toMathNode_ === 'string' ? parseText(toMathNode_) : toMathNode_

  // Generate all possible expressions by removing one term
  const expressions = generateExpressions(fromNode)

  for (const item of expressions) {
    if (expressionEquals(parseText(item.term), toMathNode)) {
      return {
        op: item.op as AOperator,
        number: item.term,
      }
    }
  }

  return null
} */

// can give back operation as +-
// export function findAllOperationsThatCanBeRemoved(
//  fromNode_: MathNode | string,
// ): { removeNumberOp: { number: string, op: AOperator, dfsNodeId: number }, newExpression: string }[] {
//  const unFlattenNodeFn = (node: MathNode) => parseText(myNodeToString(node))
//
//  const fromNodeNode = typeof fromNode_ === 'string' ? parseText(fromNode_) : unFlattenNodeFn(fromNode_) // have to unflatten because generate requires it.
//  const fromNodeString = typeof fromNode_ === 'string' ? cleanString(fromNode_) : myNodeToString(fromNodeNode)
//
//  let termOps = generateExpressions(fromNodeNode)
//  termOps = filterUniqueValues(termOps, (a, b) => a.term === b.term && a.op === b.op)
//
//  const newTermStrings = termOps.map(termOp => `(${fromNodeString}) ${getReverseOp(termOp.op)} (${termOp.term})`)
//  const result = termOps.map((term, index) => ({ removeNumberOp: { number: term.term, op: term.op, dfsNodeId: term.dfsNodeId }, newExpression: newTermStrings[index] }))
//    .filter(term => term.removeNumberOp.number !== undefined && term.removeNumberOp.op !== undefined && term.newExpression !== undefined)
//
//  // remove all terms that have undefined as the number or op or newExpression
//  return result
// }
