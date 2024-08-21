import { parseText } from '~/index'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { cleanString } from '~/util/stringUtils.js'
import { kemuNormalizeConstantNodes } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import { removeImplicitMultiplicationFromNode } from '~/newServices/treeUtil'

/**
 * @param node {string| import('mathjs').MathNode}
 * @returns {import('mathjs').MathNode}
 */
export function veryNormalizeNode(node) {
  if (typeof node === 'string')
    node = parseText(node)
  node = kemuSortArgs(kemuNormalizeConstantNodes(removeImplicitMultiplicationFromNode(node), true))
  return node
}

/**
 * @param exp0 {string| import('mathjs').MathNode}
 * @param exp1 {string| import('mathjs').MathNode}
 * @param equalityCache {EqualityCache|null} - provide a cache to get cached equality.
 * @returns {boolean|null} -
 */
export function areExpressionEqual(exp0, exp1, equalityCache = null) {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true
  if (typeof exp0 === 'object')
    exp0 = removeImplicitMultiplicationFromNode(exp0)
  if (typeof exp1 === 'object')
    exp1 = removeImplicitMultiplicationFromNode(exp1)

  const strExp0 = typeof exp0 === 'string' ? exp0 : myNodeToString(exp0)
  const strExp1 = typeof exp1 === 'string' ? exp1 : myNodeToString(exp1)
  if (cleanString(strExp0) === cleanString(strExp1)) // 'cleaned' string check
    return true

  if (!equalityCache)
    return areExpressionEqualCore(strExp0, strExp1)
  else
    return equalityCache.getCachedEquality(strExp0, strExp1, areExpressionEqualCore)
}

/**
 * @param exp0 {string|import('mathjs').MathNode}
 * @param exp1 {string|import('mathjs').MathNode}
 * @returns {boolean} -
 */
function areExpressionEqualCore(exp0, exp1) {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true

  const strExp0 = typeof exp0 === 'string' ? exp0 : myNodeToString(exp0)
  const strExp1 = typeof exp1 === 'string' ? exp1 : myNodeToString(exp1)

  if (cleanString(strExp0) === cleanString(strExp1)) // 'cleaned' string check
    return true

  const newExpNode0 = veryNormalizeNode(strExp0)
  const newExpNode1 = veryNormalizeNode(strExp1)

  return newExpNode0.equals(newExpNode1) // node equal check.
}
