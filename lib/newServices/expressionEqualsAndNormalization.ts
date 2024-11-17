import type { MathNode } from 'mathjs'
import { ConstantNode, isConstantNode, isOperatorNode, isSymbolNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { parseText } from '~/newServices/nodeServices/parseText'
import { removeImplicitMultiplicationFromNode } from '~/newServices/treeUtil'
import { kemuFlatten, kemuNormalizeConstantNodes } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import { convertNumParVarDivNumToNumVarDivNum } from '~/simplifyExpression/mscNormalizeNodeFunctions'
import type { EqualityCache } from '~/util/equalityCache'
import { makeExtendedRegExp } from '~/util/extendedRegex'
import { cleanString } from '~/util/stringUtils.js'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'

/**
 * Normalizes a node for equality comparison. Does not do all the same things as normalizeStringExpressionForEquality. You must do both for best valid normalization.
 * @param node_
 */
export function normalizeNodeForEquality(node_: MathNode | string): MathNode {
  let node = (typeof node_ === 'string') ? parseText(node_) : node_
  node = convertNumParVarDivNumToNumVarDivNum(node)
  node = convertAll1xToX(node)
  node = kemuFlatten(node)
  node = removeImplicitMultiplicationFromNode(node)
  node = convertAllSimpleFractionsToDecimals(node)
  node = kemuNormalizeConstantNodes(node)
  node = kemuSortArgs(node, true, true)
  node = convertAll1xToX(node)
  return node
}

/**
 * Normalizes a string expression for equality comparison. Does not do all the same things as normalizeNodeForEquality. You must do both for best valid normalization.
 * @param stringExpression
 */
export function normalizeStringExpressionForEquality(stringExpression: string): string {
  stringExpression = cleanString(stringExpression)

  /// / replace (number) with number
  stringExpression = stringExpression.replace(/\((\d+(\.\d+)?)\)/g, '$1')
  /// / replace (-number) with -number
  stringExpression = stringExpression.replace(/\(-(\d+(\.\d+)?)\)/g, '-$1')

  // we use 0+ to make sure that we don't have a leading - in the string. Gets rid of some +- issues.
  stringExpression = makePlusMinusMinusAndReturnString(`0+${stringExpression}`)
  // make all 1*x into x && all 1x into x
  stringExpression = stringExpression.replaceAll(/\b0[a-z]\b/gi, '0')
  stringExpression = stringExpression.replaceAll(/\b1([a-z])\b/gi, '$1')

  // make  number times var into  numberVar
  stringExpression = stringExpression.replace(/(\d)\*([a-z])/gi, '$1$2')

  //  make number - (number/number) into number + (-number/number)
  const numberRG = '\\b\\d+(?:\\.\\d+)?[a-z]?\\b' //
  const regexExp = makeExtendedRegExp(String.raw`\b(${numberRG})-\((${numberRG})/(${numberRG})\)`, 'gi') // # number - (number/number)
  stringExpression = stringExpression.replace(regexExp, '$1+(-$2/$3)')


  // lets clean the strings again
  stringExpression = cleanString(stringExpression)
  return stringExpression
}

export function areExpressionEqual(exp0: string | MathNode, exp1: string | MathNode, equalityCache: EqualityCache | null = null): boolean {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true

  if (!equalityCache) {
    return areExpressionEqualCore(exp0, exp1)
  }
  else {
    const strExp0 = typeof exp0 === 'string' ? cleanString(exp0) : myNodeToString(exp0)
    const strExp1 = typeof exp1 === 'string' ? cleanString(exp1) : myNodeToString(exp1)
    return equalityCache.getCachedEquality(strExp0, strExp1, areExpressionEqualCore)
  }
}

function areExpressionEqualCore(exp0?: string | MathNode | null, exp1?: string | MathNode | null): boolean {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true

  const strExp0 = typeof exp0 === 'string' ? cleanString(exp0) : myNodeToString(exp0)
  const strExp1 = typeof exp1 === 'string' ? cleanString(exp1) : myNodeToString(exp1)

  if (strExp0 === strExp1) // 'cleaned' string check
    return true

  const normalizedExprString0 = normalizeStringExpressionForEquality(strExp0)
  const normalizedExprString1 = normalizeStringExpressionForEquality(strExp1)

  if (normalizedExprString0 === normalizedExprString1) // 'normalized' string check
    return true

  const normalizedNode0 = normalizeNodeForEquality(parseText(normalizedExprString0))
  const normalizedNode1 = normalizeNodeForEquality(parseText(normalizedExprString1))
  return normalizedNode0.equals(normalizedNode1) // node equal check using mathjs equals
}


function convertAllSimpleFractionsToDecimals(node: MathNode): MathNode {
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

// function convert1xToX(node: MathNode): MathNode {
//  if (isOperatorNode(node) && node.op === '*' && node.args.length === 2 && isConstantNode(node.args[0]) && isSymbolNode(node.args[1]) && node.args[0].value === 1) {
//    return new ConstantNode(1)
//  }
//  return node
// }

function convertAll1xToX(node: MathNode): MathNode {
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
  const replacePlusMinus = nodeStr.replace(/\+-/g, '-').replace(/-\+/g, '-')
  return parseText(replacePlusMinus)
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

