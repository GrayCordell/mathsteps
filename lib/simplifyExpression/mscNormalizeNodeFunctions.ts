import type { MathNode } from 'mathjs'
import { OperatorNode, ParenthesisNode } from 'mathjs'
import { ConstantNode, isConstantNode, isOperatorNode, isSymbolNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { parseText } from '~/newServices/nodeServices/parseText'
import { cleanString } from '~/util/cleanString'
import { makeExtendedRegExp } from '~/util/regex'

/**
 * Converts instances of "number * (var / number)" to "(number * var) / number" at all depths
 * in the expression tree.
 *
 * @param expressionOrNode - The mathematical expression or MathNode to transform.
 * @returns The transformed expression as a unflat MathNode
 */
export function convertNumParVarDivNumToNumVarDivNum(expressionOrNode: string | MathNode): MathNode {
  const coreFn = () => {
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

  // removes parentheses nodes from the expression. We don't use them any where else normally.
  return parseText(myNodeToString(coreFn()))
}


export function convertAllSimpleFractionsToDecimals(node: MathNode): MathNode {
  // Function to traverse the expression and convert fractions to decimals
  const convertFractions = (node: MathNode) => {
    // If the node is a binary operator (like '/') and the operator is division
    if (isOperatorNode(node) && node.op === '/' && node.args.length === 2 && isConstantNode(node.args[0]) && isConstantNode(node.args[1])) {
      // Evaluate the left and right sides of the division
      const leftValue = node.args[0].value
      const rightValue = node.args[1].value

      if (leftValue % rightValue === 0) { // If the division is a whole number, return the node. We only really care about this for cases where division could be simplified to a number.
        return node
      }

      // Return the decimal result of the division
      return new ConstantNode(leftValue / rightValue)
    }

    // Recursively apply the transformation for all child nodes
    if (isOperatorNode(node) && node.args) {
      node.args = node.args.map(convertFractions)
    }

    return node
  }

  // Apply the transformation to the whole expression
  // Return the modified expression as a node
  return convertFractions(node)
}


export function convertAll1xToX(node: MathNode): MathNode {
  const convert1x = (node: MathNode) => {
    if (
      isOperatorNode(node)
      && node.op === '*'
      && node.args.length === 2
      && isConstantNode(node.args[0])
      && isSymbolNode(node.args[1])
      && node.args[0].toString() === '1'
    ) {
      return node.args[1]
    }

    if (isOperatorNode(node) && node.args) {
      node.args = node.args.map(convert1x)
    }

    return node
  }

  return convert1x(node)
}


export function makePlusMinusMinus(node: MathNode | string): MathNode {
  const nodeStr = typeof node === 'string' ? cleanString(node) : myNodeToString(node)
  return parseText(makePlusMinusMinusAndReturnString(nodeStr))
}

export function makePlusMinusMinusAndReturnString(node: MathNode | string): string {
  const nodeStr = typeof node === 'string' ? cleanString(node) : myNodeToString(node)


  const numberRG = '\\b\\d+(?:\\.\\d+)?[a-z]?\\b' //
  const regexExp = makeExtendedRegExp(
    String.raw`
  \+\-          # +-
  (             #  number / number match group
    ${numberRG}
    \/
    ${numberRG}
  )
  `,
    'gi',
  )

  return nodeStr
    .replace(regexExp, '+(-$1)') // replace +-(number/number) with +(-number/number)
    .replaceAll('+-', '-') // replace +- with -
}


export function normalizeNegativesAndFractions(node: MathNode): MathNode {
  const handleNegatives = (node: MathNode) => {
    if (isOperatorNode(node) && node.op === '/' && isConstantNode(node.args[0]) && node.args[0].value < 0) {
      // Transform -a / b into -(a / b)
      const positiveNumerator = new ConstantNode(Math.abs(node.args[0].value))
      const denominator = node.args[1]
      return new OperatorNode('-', 'unaryMinus', [
        new OperatorNode('/', 'divide', [positiveNumerator, denominator]),
      ])
    }

    if (isOperatorNode(node) && node.args) {
      node.args = node.args.map(handleNegatives)
    }

    return node
  }

  return handleNegatives(node)
}
