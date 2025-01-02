import type { MathNode, OperatorNode } from 'mathjs'
import { isOperatorNode } from '~/config'
import { parseText } from '~/newServices/nodeServices/parseText'

/*
* Extracts all numerator nodes from a MathNode, considering division and mixed operations.
*
* @param node - The MathNode to process. (NOTE: I DO NOT KNOW IF IT WORKS WITH FLATTENED NODES YET)
* @returns An array of MathNode objects representing the numerators.
*/
export function extractNumerators(_node: MathNode | string): MathNode[] {
  const node = typeof _node === 'string' ? parseText(_node) : _node
  const numerators: MathNode[] = []


  /**
   * Recursively traverses the MathNode tree to collect numerators.
   * @param currentNode - The current node being processed.
   */
  function traverse(currentNode: MathNode, parentOperator: string | null = null): void {
    if (isOperatorNode(currentNode)) {
      const opNode = currentNode as OperatorNode

      if (opNode.op === '/') {
        // Extract numerator for division
        numerators.push(opNode.args[0])
        // traverse the numerator to check for nested divisions
        traverse(opNode.args[0], parentOperator)
        // Process denominator (it might contain further divisions or multiplications)
        traverse(opNode.args[1], '/')
      }
      else if (opNode.op === '*') {
        // Traverse each operand to check for nested divisions or numerators
        opNode.args.forEach(arg => traverse(arg, '*'))
      }
      else if (opNode.op === '+' || opNode.op === '-') {
        // Handle addition or subtraction if it's within a division context
        if (parentOperator === '/')
          numerators.push(currentNode)
        else
          opNode.args.forEach(arg => traverse(arg))
      }
    }
  }

  traverse(node)
  return numerators
}
