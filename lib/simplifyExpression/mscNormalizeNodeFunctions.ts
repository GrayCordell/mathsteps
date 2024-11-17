import type { MathNode } from 'mathjs'
import { OperatorNode, ParenthesisNode } from 'mathjs'
import { isConstantNode, isOperatorNode, isSymbolNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { parseText } from '~/newServices/nodeServices/parseText'

/**
 * Converts instances of "number * (var / number)" to "(number * var) / number" at all depths
 * in the expression tree.
 *
 * @param expressionOrNode - The mathematical expression or MathNode to transform.
 * @returns The transformed expression as a MathNode
 */
export function convertNumParVarDivNumToNumVarDivNum(expressionOrNode: string | MathNode): MathNode {
  // TODO see if It can handle without parseText(myNodeToString(expressionOrNode))
  const mathTree: MathNode = typeof expressionOrNode === 'string' ? parseText(expressionOrNode) : parseText(myNodeToString(expressionOrNode))

  function traverse(node: MathNode): MathNode {
    if (isOperatorNode(node)) {
      const opNode = node as OperatorNode

      // Recursively transform arguments
      const transformedArgs = opNode.args.map(traverse)

      // Now, create a new operator node with transformed arguments
      const newNode = new OperatorNode(opNode.op, opNode.fn, transformedArgs)

      // Now, check if newNode matches the pattern
      if (newNode.op === '*') {
        const [left, right] = newNode.args

        // Check if pattern matches number * (var / number)
        if (isConstantNode(left) && isOperatorNode(right) && right.op === '/') {
          const rightOpNode = right as OperatorNode
          const [numerator, denominator] = rightOpNode.args

          if (isSymbolNode(numerator) && isConstantNode(denominator)) {
            // We have matched the pattern: number * (var / number)
            // Now create the transformed node: (number * var) / number

            const newNumerator = new OperatorNode('*', 'multiply', [left, numerator])
            const newNumeratorWithParens = new ParenthesisNode(newNumerator)
            const newDenominator = denominator

            const transformedNode = new OperatorNode('/', 'divide', [newNumeratorWithParens, newDenominator])

            return transformedNode
          }
        }

        // Check if pattern matches (var / number) * number
        if (isOperatorNode(left) && left.op === '/' && isConstantNode(right)) {
          const leftOpNode = left as OperatorNode
          const [numerator, denominator] = leftOpNode.args

          if (isSymbolNode(numerator) && isConstantNode(denominator)) {
            // We have matched the pattern: (var / number) * number
            // Now create the transformed node: (number * var) / number

            const newNumerator = new OperatorNode('*', 'multiply', [right, numerator])
            const newNumeratorWithParens = new ParenthesisNode(newNumerator)
            const newDenominator = denominator

            const transformedNode = new OperatorNode('/', 'divide', [newNumeratorWithParens, newDenominator])

            return transformedNode
          }
        }
      }

      return newNode
    }
    else {
      // Not an operator node, return as is
      return node
    }
  }
  // Convert the transformed AST back to string using myNodeToString
  // const transformedExpression = myNodeToString(transformedTree)
  return traverse(mathTree)
}
