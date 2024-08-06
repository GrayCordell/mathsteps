import { applyRules } from '../simplifyExpression/_common.js'

function createFunctionForEveryRule(rules, onApplyRuleFunction = applyRules) {
  const fns = []
  rules.forEach((rule) => {
    // make sure the id is unique. If not, add a number to it.
    rule.ogId = rule.id
    if (fns.some(f => f.ogId === rule.id)) {
      const length = fns.filter(f => f.ogId === rule.id).length + 1
      rule.id = `${rule.id}__${length}`
    }
    // The common function with the alone rule
    const fn = node => onApplyRuleFunction(node, [rule])
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
export { createFunctionForEveryRule }
export default {
  createFunctionForEveryRule,
}
