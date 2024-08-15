import { parseText } from '../index.js'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'
import { myNodeToString } from '~/util/myNodeToString.js'
import { cleanString } from '~/util/mscStringUtils.js'

/**
 * @param exp0 {string|Node}
 * @param exp1 {string|Node}
 * @param equalityCache {EqualityCache|null} - provide a cache to get cached equality.
 * @returns {boolean|null} -
 */
export function areExpressionEqual(exp0, exp1, equalityCache = null) {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true
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
 * @param exp0 {string|Node}
 * @param exp1 {string|Node}
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

  const newExpNode0 = kemuSortArgs(parseText(strExp0), true)
  const newExpNode1 = kemuSortArgs(parseText(strExp1), true)

  return newExpNode0.equals(newExpNode1) // node equal check.
}
