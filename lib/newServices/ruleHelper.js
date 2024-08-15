import { applyRules } from '../simplifyExpression/_common.js'
import { makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher.js'

export function createFunctionForEveryRule(rules, onApplyRuleFunction = applyRules) {
  const fns = []
  rules.forEach((rule) => {
    // make sure the id is unique. If not, add a number to it.
    rule.ogId = rule.id
    if (fns.some(f => f.ogId === rule.id)) {
      const length = fns.filter(f => f.ogId === rule.id).length + 1
      rule.id = `${rule.id}__${length}`
    }
    // The common function with the alone rule
    const cache = new Map()
    const fn = (node, arg2, arg3, arg4) => {
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
