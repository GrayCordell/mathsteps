import { applyRules } from '~/simplifyExpression/kemuSimplifyCommonServices'
import { makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher'
import type { AChangeType, AChangeTypeCore } from '~/types/changeType/ChangeTypes'
import type { MathNode } from 'mathjs'

export function isRuleInList(rule: { id: string }, ruleList: { id: string }[]) {
  return ruleList.some(r => r.id === rule.id)
}

export const removeCaseNumberFromRuleId = (ruleId: AChangeType | string): AChangeTypeCore => (ruleId.split('__CASE_')[0] as AChangeTypeCore)
export const removeCaseNumberFromChangeType = (changeType: AChangeType | string): AChangeTypeCore => removeCaseNumberFromRuleId(changeType)

export interface UnknownButMaybeHasGetMistakes { getMistakes?: boolean }
type FN = (node: MathNode, arg2: UnknownButMaybeHasGetMistakes, arg3: UnknownButMaybeHasGetMistakes, arg4: UnknownButMaybeHasGetMistakes) => unknown
export function createFunctionForEveryRule(rules: any[], onApplyRuleFunction = applyRules): { id: string, ogId: string, fn: FN }[] {
  const fns: { id: string, ogId: string, fn: FN }[] = []
  rules.forEach((rule) => {
    // make sure the id is unique. If not, add a number to it.
    rule.ogId = rule.id
    if (fns.some(f => f.ogId === rule.id)) {
      const length = fns.filter(f => f.ogId === rule.id).length + 1
      rule.id = `${rule.id}__CASE_${length}`
    }
    // The common function with the alone rule
    const cache = new Map()

    const fn: FN = (node, arg2, arg3, arg4) => {
      // TODO really dumb
      const isOptionsObjWithGetMistakes = arg2?.getMistakes || arg3?.getMistakes || arg4?.getMistakes || false

      const key = makeKeyFromNode(node)
      if (cache.has(key)) {
        // console.log('cache hit')
        return cache.get(key)
      }

      const result = onApplyRuleFunction(node, [rule], { getMistakes: isOptionsObjWithGetMistakes })
      cache.set(key, result)
      return result
    }
    // Set the name of the function to the rule id. Helpful for debugging.
    Object.defineProperty(fn, 'name', { value: rule.id, writable: false })
    // Add the function to the list
    fns.push({
      id: rule.id,
      ogId: rule.ogId,
      fn,
    })
  })
  return fns
}
