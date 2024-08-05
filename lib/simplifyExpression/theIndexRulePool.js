const { commonRules,commonRulesPooledTogether } = require('./rules/commonRules')
const { commonFunctions,commonFunctionsPooledTogether} = require('./rules/commonFunctions')


// Originally, the rules were pooled together so that it only gets 1 match from each of these other "rulePools" and then moves on to the next roolPool.
// I wanted a version that would try all the rules in each rule pool. So now we have two versions of the rule pools.
// POOLED_TOGETHER_POOL_OF_RULES is used in solving steps normally, and POOL_OF_RULES is used in finding "all possible simplifications" of a node.

const POOLED_TOGETHER_POOL_OF_RULES = {
  // Convert 3.14 to 314/100 etc. in non-numerical mode.
  convertDecimalToFraction: require('./rules/convertDecimalToFraction'),

  // Apply logarithm rules before arithmetic to avoid huge intermediate
  // values like log10(10^23) => log10(100000000000000000000000)
  // We want log10(10^23) => 23 instead.
  commonFunctionsLogXY: require('./rules/commonFunctionsLogXY'),

  // Basic simplifications that we always try first e.g. (...)^0 => 1
  commonRules: commonRulesPooledTogether,

  // x*a/x gives a
  cancelTerms: require('./rules/cancelTerms'),

  // 3x + 2x gives 5x etc.
  collectLikeTerms: require('./rules/collectLikeTerms'),

  // common function simplification e.g. sin(0) gives 0
  commonFunctions: commonFunctionsPooledTogether,

  // (a + b + c + ...) * x gives ac ax + bx + cx + ... etc.
  distribute: require('./rules/distribute'),

  // sqrt(x^2) gives x or |x| (depends on domain)
  sqrtFromPow: require('./rules/sqrtFromPow'),

  // sqrt(n) - calculate if possible.
  sqrtFromConstant: require('./rules/sqrtFromConstant'),

  // (a + b)^2 gives a^2 + 2ab + b^2 etc.
  multiplyShortFormulas: require('./rules/multiplyShortFormulas'),

  // Numerical result e.g. 1.414 instead of sqrt(2).
  calculateNumericalValue: require('./rules/calculateNumericalValue')

}

// Given rulesArray
const rulesArray = [
    { id: 'convertDecimalToFraction', fn: require('./rules/convertDecimalToFraction') },
    { id: 'commonFunctionsLogXY', fn: require('./rules/commonFunctionsLogXY') },
  ...commonRules,
    { id: 'cancelTerms', fn: require('./rules/cancelTerms') },
    { id: 'collectLikeTerms', fn: require('./rules/collectLikeTerms') },
  ...commonFunctions,
       // { id: 'commonFunctions', fn: require('./rules/commonFunctions') },
    { id: 'distribute', fn: require('./rules/distribute') },
    { id: 'sqrtFromPow', fn: require('./rules/sqrtFromPow') },
    { id: 'sqrtFromConstant', fn: require('./rules/sqrtFromConstant') },
    { id: 'multiplyShortFormulas', fn: require('./rules/multiplyShortFormulas') },
    { id: 'calculateNumericalValue', fn: require('./rules/calculateNumericalValue') }
]
// Convert the array back to an object
const POOL_OF_RULES = rulesArray.reduce((acc, rule) => {
  acc[rule.id] = rule.fn
  return acc
}, {})

module.exports = {
  POOL_OF_RULES,
  POOLED_TOGETHER_POOL_OF_RULES,
}
