import type { MathNode } from 'mathjs'
import { ParenthesisNode } from 'mathjs'
import math, { isOperatorNode, isParenthesisNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { mathNodePrecedence } from '~/newServices/nodeServices/nodeHelpers'
import { parseText } from '~/newServices/nodeServices/parseText'
import { kemuFlatten } from '~/simplifyExpression/kemuSimplifyCommonServices'

// Function to simplify an expression by removing redundant parentheses
export function removeUnnecessaryParentheses(expression: string | MathNode): MathNode {
  const expressionAsString = typeof expression === 'string' ? expression : myNodeToString(expression)
  const node = math.parse(expressionAsString)
  return kemuFlatten(parseText(myNodeToString(simplifyNode(node)))) as MathNode
}

// Helper function to recursively simplify the AST
function simplifyNode(node: MathNode): MathNode {
  if (isParenthesisNode(node)) {
    // Unwrap the content of the ParenthesisNode
    const childNode = node.content

    // Simplify the child node recursively
    const simplifiedChild = simplifyNode(childNode)
    // Check if the parenthesis is necessary
    if (isPEMDASCompliant(simplifiedChild))
      return simplifiedChild // Remove the parenthesis
    else
      return new ParenthesisNode(simplifiedChild) // Keep the parenthesis
  }
  else if (isOperatorNode(node)) {
    // Simplify all child nodes
    node.args = node.args.map(simplifyNode)
  }
  return node
}

// Function to check if a node complies with PEMDAS
function isPEMDASCompliant(node: MathNode): boolean {
  if (isOperatorNode(node)) {
    const precedence = mathNodePrecedence(node)

    // Check all child nodes
    for (const child of node.args) {
      if (isOperatorNode(child)) {
        const childPrecedence = mathNodePrecedence(child)

        // If child precedence is higher, parentheses might be needed
        if (childPrecedence < precedence)
          return false
      }
    }
  }


  // Recursively check child nodes, if any
  if (isOperatorNode(node) && node.args)
    return node.args.every(isPEMDASCompliant)

  return true
}
