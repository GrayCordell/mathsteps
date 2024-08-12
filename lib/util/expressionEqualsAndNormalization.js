import { parseText } from '../index.js'
import clone from './clone.js'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'
import { cleanString, myNodeToString } from '~/util/myNodeToString.js'
import { getCachedEquality } from '~/util/equalityCache.js'

// export function myMoreNormalization(node) {
//
// }

export function expressionEquals(exp0, exp1) {
  let str0 = exp0
  let str1 = exp1
  if (typeof str0 !== 'string')
    str0 = myNodeToString(exp0)
  if (typeof str1 !== 'string')
    str1 = myNodeToString(exp1)
  if (!str0 === null || !str1 === null || str0 === undefined || str1 === undefined)
    return false

  return getCachedEquality(str0, str1, isExpressionEqualsCore)
}

/**
 *
 * @param exp0 {string|Node}
 * @param exp1 {string|Node}
 * @returns {boolean}
 */
export function isExpressionEqualsCore(exp0, exp1) {
  if (typeof exp0 === 'string' && cleanString(exp0) === cleanString(exp1)) // naive string check
    return true
  if (!exp0 || !exp1) // fail
    return false

  const newexp0 = typeof exp0 !== 'string'
    ? kemuSortArgs(clone((exp0)), true)
    : kemuSortArgs(parseText(exp0), true)

  const newexp1 = typeof exp1 !== 'string'
    ? kemuSortArgs((clone(exp1)), true)
    : kemuSortArgs((parseText(exp1)), true)

  return newexp0.equals(newexp1) || myNodeToString(newexp0) === myNodeToString(newexp1)
}
