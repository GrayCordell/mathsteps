import type { MathNode } from 'mathjs'
import { ConstantNode, isConstantNode, isOperatorNode, OperatorNode } from '~/config'
import { parseText } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { cleanString } from '~/util/stringUtils'

/**
 * Recursively removes unnecessary *1 from a MathJS expression node.
 * Handles flattened operator nodes and ensures non-operator nodes are handled correctly.
 * @param node The MathJS node to process.
 * @returns A new node with unnecessary *1 removed.
 */
export function removeUnnecessaryMultiplications(node: MathNode): MathNode {
  // If it's a constant node return it directly
  if (isConstantNode(node)) {
    return node
  }

  // If it's an operator node and specifically multiplication or division
  if (isOperatorNode(node)) {
    if (node.op === '*' || node.op === '/') {
      // Recursively process each argument (child node)
      const newArgs = node.args.map(arg => removeUnnecessaryMultiplications(arg))

      if (node.op === '*') {
        // Filter out any '1' from the multiplication arguments
        const filteredArgs = newArgs.filter(arg => !isOne(arg))

        if (filteredArgs.length === 0) {
          // If all args are 1 (e.g., 1 * 1), return 1
          return new ConstantNode(1)
        }
        else if (filteredArgs.length === 1) {
          // If only one non-1 argument remains, return it directly
          return filteredArgs[0]
        }
        else {
          // If more than one argument remains, return a new multiplication node
          return new OperatorNode('*', 'multiply', filteredArgs)
        }
      }
      else if (node.op === '/') {
        // Special handling for division, do not remove '1' in the denominator
        const [numerator, denominator] = newArgs

        if (isOne(denominator)) {
          // If the denominator is 1, just return the numerator
          return numerator
        }

        // Reconstruct the division node with potentially simplified arguments
        return new OperatorNode('/', 'divide', [numerator, denominator])
      }
    }
    else {
      // Recursively process other operator nodes that are not multiplication or division
      const children = node.args.map((child: MathNode) => removeUnnecessaryMultiplications(child))
      return new OperatorNode(node.op, node.fn, children)
    }
  }

  // Return the node as is if it's not an operator or has no children
  return node
}

/**
 * Checks if the given node is the constant 1.
 * @param node The node to check.
 * @returns True if the node is the constant 1, false otherwise.
 */
function isOne(node: MathNode | string | number): boolean {
  if (typeof node === 'number')
    return node === 1
  else if (typeof node === 'string')
    return node === '1'
  else
    return isConstantNode(node) && node.value.toString() === '1'
}

export function makePlusMinusMinus(node: MathNode | string): MathNode {
  const nodeStr = typeof node === 'string' ? cleanString(node) : myNodeToString(node)
  const replacePlusMinus = nodeStr.replace(/\+-/g, '-').replace(/-\+/g, '-')
  return parseText(replacePlusMinus)
}
export function makePlusMinusMinusAndReturnString(node: MathNode | string): string {
  const nodeStr = typeof node === 'string' ? cleanString(node) : myNodeToString(node)
  const replacePlusMinus = nodeStr.replace(/\+-/g, '-').replace(/-\+/g, '-')
  return replacePlusMinus
}
