import type { MathNode } from 'mathjs'
import mathsteps from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { parseText } from '~/newServices/nodeServices/parseText'
import { removeUnnecessaryParentheses } from '~/newServices/nodeServices/removeUnnessaryParenthesis'
import { removeImplicitMultiplicationFromNode } from '~/newServices/treeUtil'
import { kemuFlatten, kemuNormalizeConstantNodes } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import { convertAll1xToX, convertAllSimpleFractionsToDecimals, convertNumParVarDivNumToNumVarDivNum, makePlusMinusMinusAndReturnString, normalizeNegativesAndFractions } from '~/simplifyExpression/mscNormalizeNodeFunctions'
import { areArraysEqualUnordered } from '~/util/arrayUtils'
import { cleanString } from '~/util/cleanString'
import type { EqualityCache } from '~/util/equalityCache'
import { makeExtendedRegExp, RGFraction } from '~/util/regex'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'

export const getNodeStepsToSolveExpression = (userStep: string) => (mathsteps.simplifyExpression({
  expressionAsText: cleanString(userStep),
  isDebugMode: false,
  expressionCtx: undefined,
  getMistakes: false,
  getAllNextStepPossibilities: false,
  onStepCb: (step: any) => {},
}) as MathNode)


/**
 * Normalizes a node for equality comparison. Does not do all the same things as normalizeStringExpressionForEquality. You must do both for best valid normalization.
 * @param node_
 */
export function normalizeNodeForEquality(node_: MathNode | string): MathNode {
  let node = (typeof node_ === 'string') ? parseText(node_) : node_
  node = convertNumParVarDivNumToNumVarDivNum(node)
  node = removeUnnecessaryParentheses(node)
  node = convertAll1xToX(node)
  node = kemuFlatten(node)
  node = removeImplicitMultiplicationFromNode(node)
  node = convertAllSimpleFractionsToDecimals(node)
  node = normalizeNegativesAndFractions(node)
  node = kemuNormalizeConstantNodes(node)
  node = convertAll1xToX(node)
  node = kemuSortArgs(node, true, true)
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
  stringExpression = stringExpression.replace(/(\d+)\*([a-z])/gi, '$1$2')

  //  make number - (number/number) into number + (-number/number)
  const numberRG = '\\b\\d+(?:\\.\\d+)?[a-z]?\\b' //
  const regexExp = makeExtendedRegExp(String.raw`\b(${numberRG})-\((${numberRG})/(${numberRG})\)`, 'gi') // # number - (number/number)
  stringExpression = stringExpression.replace(regexExp, '$1+(-$2/$3)')

  // lets clean the strings again
  stringExpression = cleanString(stringExpression)
  return stringExpression
}


export function areEquationsEqual(eq0: string, eq1: string, equalityCache: EqualityCache | null = null): boolean {
  const sides0 = eq0.split('=').map(side => cleanString(side))
  const sides1 = eq1.split('=').map(side => cleanString(side))

  // TODO it may need to also test the flipped version
  return (areExpressionEqual(sides0[0], sides1[0], equalityCache) && areExpressionEqual(sides0[1], sides1[1], equalityCache))
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

  // Special case: Similar based on requirements, then can do equality based on the  eventual answer
  if (canDoEqualityBasedOnEventualAnswer(normalizedExprString0, normalizedExprString1)) {
    // Equality based on eventual answer
    const answer1 = myNodeToString(getNodeStepsToSolveExpression(normalizedExprString0))
    const answer2 = myNodeToString(getNodeStepsToSolveExpression(normalizedExprString1))
    if (answer1 === answer2) // string check
      return true
    const normalizedAnswer1 = normalizeStringExpressionForEquality(answer1)
    const normalizedAnswer2 = normalizeStringExpressionForEquality(answer2)
    if (normalizedAnswer1 === normalizedAnswer2) // 'normalized' string check
      return true
    const normalizedAnswerNode0 = normalizeNodeForEquality(parseText(normalizedAnswer1))
    const normalizedAnswerNode1 = normalizeNodeForEquality(parseText(normalizedAnswer2))

    return normalizedAnswerNode0.equals(normalizedAnswerNode1) // Normalized Node Check. (node equal check using mathjs equals)
  }
  // Normal case: Normalized Node Check
  else {
    const normalizedNode0 = normalizeNodeForEquality(parseText(normalizedExprString0))
    const normalizedNode1 = normalizeNodeForEquality(parseText(normalizedExprString1))
    return normalizedNode0.equals(normalizedNode1) // Normalized Node Check. (node equal check using mathjs equals)
  }
}


/**
 * Checks if two mathematical expressions are equivalent based on simplified, normalized forms.
 * This is used when traditional normalization is complex or unavailable, focusing on specific
 * structural and operator-based rules for equality.
 *
 * ### Criteria for Equality by Eventual Answer checking:
 * 1. **Operators**: Both expressions must have the same count of `*` and `/` operators.
 * 2. **Fractions**: Both must contain identical fractions (order doesn't matter).
 * 3. **Normalization**: Differences in parentheses, `+`, and `-` are ignored.
 * 4. **NumbersAndVars**: All Numbers and variables be the same, can be in any order.
 *
 * @param strExp0 - First mathematical expression as a string.
 * @param strExp1 - Second mathematical expression as a string.
 * @returns `true` if the expressions are equivalent; otherwise, `false`.
 */
function canDoEqualityBasedOnEventualAnswer(strExp0: string, strExp1: string) {
  //
  // 1. **Operators**: Both expressions must have the same count of `*` and `/` operators.
  //
  const countMult0 = (strExp0.match(/\*/g) || []).length
  const countMult1 = (strExp1.match(/\*/g) || []).length
  if (countMult0 !== countMult1)
    return false
  const countDiv0 = (strExp0.match(/\//g) || []).length
  const countDiv1 = (strExp1.match(/\//g) || []).length
  if (countDiv0 !== countDiv1)
    return false

  //
  // 2. **Fractions**: Both must contain the same identical fractions (order doesn't matter). Made to avoid shadowing issues with certain fraction simplifications.
  //
  if (strExp0.includes('/')) {
    const fractions0 = strExp0.match(RGFraction) || []
    const fractions1 = strExp1.match(RGFraction) || []
    if (!areArraysEqualUnordered(fractions0, fractions1, { isEqualFn: (a, b) => a === b }))
      return false
  }

  // put space after operators
  const operators = ['+', '-', '*', '/']
  operators.forEach((op) => {
    strExp0 = strExp0.replaceAll(op, ` ${op} `)
    strExp1 = strExp1.replaceAll(op, ` ${op} `)
  })
  // remove multiple spaces
  strExp0 = strExp0.replace(/\s+/g, ' ')
  strExp1 = strExp1.replace(/\s+/g, ' ')

  // remove parenthesis
  strExp0 = strExp0.replaceAll('(', '').replaceAll(')', '')
  strExp1 = strExp1.replaceAll('(', '').replaceAll(')', '')

  // replace + and - with space
  strExp0 = strExp0.replaceAll('+', ' ').replaceAll('-', ' ')
  strExp1 = strExp1.replaceAll('+', ' ').replaceAll('-', ' ')

  // split by spaces so we can group the necessary terms together. Then split by spaces and sort them.
  // This all should make something like 3 + (22 * 1) into *$1$22$3 // sorted and no +- or ()
  const sortedStrExp0 = strExp0.split(/\s+/).sort().join('$')
  const sortedStrExp1 = strExp1.split(/\s+/).sort().join('$')
  return sortedStrExp0 === sortedStrExp1
}


/*
function getAllConstantsThatAreDividedBySomething(node_: MathNode | string, hasDividedInAnyParent: boolean = false): MathNode[] {
  const node = typeof node_ === 'string' ? parseText(node_) : node_
  const numbersDivided: MathNode[] = []
  const isDivided = (node: MathNode) => {
    hasDividedInAnyParent = hasDividedInAnyParent || (isOperatorNode(node) && node.op === '/')
    if (hasDividedInAnyParent)
      numbersDivided.push(node)
    if (isOperatorNode(node) && node.args)
      node.args.forEach(arg => isDivided(arg))
  }
  isDivided(node)
  return numbersDivided
} */
