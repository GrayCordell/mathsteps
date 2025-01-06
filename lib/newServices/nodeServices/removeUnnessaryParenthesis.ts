import type { MathNode } from 'mathjs'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import type { TermTypeAndIndex } from '~/newServices/nodeServices/nodeHelpers'
import { flattenAndIndexTrackAST, termToString } from '~/newServices/nodeServices/nodeHelpers'
import { parseText } from '~/newServices/nodeServices/parseText'


function _tryParseTextTermToString(terms: TermTypeAndIndex[]): MathNode | null {
  const cleanStrFn = (str: string) => str.replace(/\s+/g, '').replace(/\+\-/g, '-').replace(/\-\+/g, '-').replace(/\-\-/g, '+').replace(/\+\+/g, '+')
  const stringTerm = termToString(terms)

  try {
    return parseText(cleanStrFn(stringTerm))
  }
  catch (e) {
    console.log('error in tryTermToString', { stringTerm, terms, e })
    return null
  }
}

/**
 * Removes unnecessary parentheses from a mathematical expression. This function will remove parentheses that do not affect the order of operations. It is not perfect.
 */
export function removeUnnecessaryParentheses(expression: string | MathNode): MathNode {
  const node: MathNode = typeof expression === 'string' ? parseText(expression) : expression /* parseText(myNodeToString(expression)) */
  // console.log('removeUnnecessaryParentheses', JSON.stringify(node))

  // TODO FIX. We are not currently worried about function calls just yet. If the expression text includes function calls lets just ignore everything for now. Terms needs to fix this later.
  const expressionAsString = typeof expression === 'string' ? expression : myNodeToString(node)
  const functions = ['sqrt', 'log', 'ln', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'acot', 'asec', 'acsc', 'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'asinh', 'acosh', 'atanh', 'acoth', 'asech', 'acsch']
  if (functions.some(f => expressionAsString.toLowerCase().includes(f)))
    return node

  const terms = flattenAndIndexTrackAST(node).sort((a, b) => a.index! - b.index!)

  const newNode = _tryParseTextTermToString(terms) // if error parsing for some reason then just return the original node
  return !newNode ? node : newNode
}

//
/// / Helper function to recursively simplify the AST
// function simplifyNode(node: MathNode): MathNode {
//  if (isParenthesisNode(node)) {
//    // Unwrap the content of the ParenthesisNode
//    const childNode = node.content
//
//    // Simplify the child node recursively
//    const simplifiedChild = simplifyNode(childNode)
//    // Check if the parenthesis is necessary
//    if (isPEMDASCompliant(simplifiedChild))
//      return simplifiedChild // Remove the parenthesis
//    else
//      return new ParenthesisNode(simplifiedChild) // Keep the parenthesis
//  }
//  else if (isOperatorNode(node)) {
//    // Simplify all child nodes
//    node.args = node.args.map(simplifyNode)
//  }
//  return node
// }
//
/// / Function to check if a node complies with PEMDAS
// function isPEMDASCompliant(node: MathNode): boolean {
//  if (isOperatorNode(node)) {
//    const precedence = mathNodePrecedence(node)
//
//    // Check all child nodes
//    for (const child of node.args) {
//      if (isOperatorNode(child)) {
//        const childPrecedence = mathNodePrecedence(child)
//
//        // If child precedence is higher, parentheses might be needed
//        if (childPrecedence < precedence)
//          return false
//      }
//    }
//  }
//
//
//  // Recursively check child nodes, if any
//  if (isOperatorNode(node) && node.args)
//    return node.args.every(isPEMDASCompliant)
//
//  return true
// }
