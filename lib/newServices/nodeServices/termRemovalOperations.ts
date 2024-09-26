import type { MathNode } from 'mathjs'
import { isConstantNode, isOperatorNode } from '~/config'
import { parseText } from '~/index'

import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import clone from '~/newServices/nodeServices/clone'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'

type ExpressionEquals = (exp0: MathNode, exp1: MathNode) => boolean
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

// Function to generate all possible expressions with one term removed
function generateExpressions(
  node: MathNode,
): { expr: MathNode, operation: string, term: string }[] {
  let expressions: Array<{ expr: MathNode, operation: string, term: string }> = []
  const operations = ['+', '-', '*', '/']

  if (isOperatorNode(node) && operations.includes(node.op)) {
    // Remove left operand (replace operator node with right operand)
    let expr = clone(node.args[1])
    let operation: string = node.op
    let term = myNodeToString(node.args[0])

    if (node.op === '+' && isNegative(expr)) {
      operation = '+-'
    }

    expressions.push({
      expr,
      operation,
      term,
    })

    // Remove right operand (replace operator node with left operand)
    expr = clone(node.args[0])
    operation = node.op
    term = myNodeToString(node.args[1])

    if (node.op === '+' && isNegative(expr)) {
      operation = '+-'
    }

    expressions.push({
      expr,
      operation,
      term,
    })
  }

  if (isOperatorNode(node) && node.args) {
    for (const arg of node.args) {
      expressions = expressions.concat(generateExpressions(arg))
    }
  }

  return expressions
}

// can give back operation as +-
export function findTermRemovalOperation(
  fromNode_: MathNode | string,
  toMathNode_: MathNode | string,
  expressionEquals: ExpressionEquals = areExpressionEqual,
): { op: AOperator, number: string } | null {
  const fromNode = typeof fromNode_ === 'string' ? parseText(fromNode_) : fromNode_
  const toMathNode = typeof toMathNode_ === 'string' ? parseText(toMathNode_) : toMathNode_

  // Generate all possible expressions by removing one term
  const expressions = generateExpressions(fromNode)

  for (const item of expressions) {
    if (expressionEquals(item.expr, toMathNode)) {
      return {
        op: item.operation as AOperator,
        number: item.term,
      }
    }
  }

  return null
}
