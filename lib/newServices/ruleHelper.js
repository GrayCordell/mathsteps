// @ts-check
import { applyRules } from '../simplifyExpression/kemuSimplifyCommonServices.js'
import { makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher.js'

/**
 * @param {{ id: any; }} rule
 * @param {any[]} ruleList
 */
export function isRuleInList(rule, ruleList) {
  return ruleList.some(r => r.id === rule.id)
}

/**
 * @param {string} rootChangeType
 * @param {string} changeType
 */
export function isSameRootChangeType(rootChangeType, changeType) {
  // remove __CASE_1, __CASE_2, etc.
  const rootChangeTypeWithoutCase = rootChangeType.split('__CASE_')[0]
  const changeTypeWithoutCase = changeType.split('__CASE_')[0]
  return rootChangeTypeWithoutCase === changeTypeWithoutCase
}

/**
 * @param ruleId {string}
 * @returns {string}
 */
export function removeCaseNumberFromRuleId(ruleId) {
  return ruleId.split('__CASE_')[0]
}
/** @param changeType {string} @returns {string} */
export function removeCaseNumberFromChangeType(changeType) {
  return removeCaseNumberFromRuleId(changeType)
}

/**
 *
 * @param rules {any[]}
 * @param onApplyRuleFunction {function}
 * @returns {{id: string, ogId: string, fn: Function}[]}
 */
export function createFunctionForEveryRule(rules, onApplyRuleFunction = applyRules) {
  /** @type {{ id: string; ogId: string; fn: Function; }[]} */
  const fns = []
  rules.forEach((rule) => {
    // make sure the id is unique. If not, add a number to it.
    rule.ogId = rule.id
    if (fns.some(f => f.ogId === rule.id)) {
      const length = fns.filter(f => f.ogId === rule.id).length + 1
      rule.id = `${rule.id}__CASE_${length}`
    }
    // The common function with the alone rule
    const cache = new Map()

    /**
     *
     * @param node {import('mathjs').MathNode}
     * @param arg2 {{getMistakes?: boolean}}
     * @param arg3 {{getMistakes?: boolean}}
     * @param arg4 {{getMistakes?: boolean}}
     * @returns {any}
     */
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
