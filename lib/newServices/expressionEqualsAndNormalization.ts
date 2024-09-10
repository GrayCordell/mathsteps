import { parseText } from '~/index'
import kemuSortArgs from '../simplifyExpression/kemuSortArgs.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { cleanString } from '~/util/stringUtils.js'
import { kemuFlatten, kemuNormalizeConstantNodes } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import { removeImplicitMultiplicationFromNode } from '~/newServices/treeUtil'
import type { MathNode } from 'mathjs'
import type { EqualityCache } from '~/util/equalityCache'
import { makePlusMinusMinusAndReturnString } from '~/newServices/nodeServices/removeUnnecessaryMultiplications'

export function veryNormalizeNode(node_: MathNode | string): MathNode {
  let node = (typeof node_ === 'string') ? parseText(node_) : node_
  node = kemuSortArgs(kemuNormalizeConstantNodes(removeImplicitMultiplicationFromNode(kemuFlatten(node))), true) // TODO Its possible there could be issues if we don't remove +- here too. (We can't right now because it requires a parse)
  return <MathNode>node
}

export function areExpressionEqual(exp0: string | MathNode, exp1: string | MathNode, equalityCache: EqualityCache | null = null): boolean {
  if (!exp0 || !exp1) // if either is null or undefined, we aren't going to compare them.
    return false
  if (exp0 === exp1) // same object reference. Or also same exact string but we will check "cleaned" strings later.
    return true

  let strExp0 = typeof exp0 === 'string' ? cleanString(exp0) : myNodeToString(exp0)
  let strExp1 = typeof exp1 === 'string' ? cleanString(exp1) : myNodeToString(exp1)
  strExp0 = makePlusMinusMinusAndReturnString(strExp0)
  strExp1 = makePlusMinusMinusAndReturnString(strExp1)

  if (strExp0 === strExp1) // 'cleaned' string check
    return true
  if (!equalityCache)
    return areExpressionEqualCore(strExp0, strExp1)
  else
    return equalityCache.getCachedEquality(strExp0, strExp1, areExpressionEqualCore)
}

function areExpressionEqualCore(exp0?: string | MathNode | null, exp1?: string | MathNode | null): boolean {
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
