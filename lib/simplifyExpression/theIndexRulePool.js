import { commonRules, commonRulesPooledTogether } from './rules/commonRules'
import commonFunctions$0 from './rules/commonFunctions.js'
import convertDecimalToFraction from './rules/convertDecimalToFraction.js'
import commonFunctionsLogxy from './rules/commonFunctionsLogXY.js'
import cancelTerms from './rules/cancelTerms.js'
import collectLikeTerms from './rules/collectLikeTerms.js'
import distribute from './rules/distribute.js'
import sqrtFromPow from './rules/sqrtFromPow.js'
import sqrtFromConstant from './rules/sqrtFromConstant.js'
import multiplyShortFormulas from './rules/multiplyShortFormulas.js'
import calculateNumericalValue from './rules/calculateNumericalValue.js'

const { commonFunctions, commonFunctionsPooledTogether } = commonFunctions$0
// Originally, the rules were pooled together so that it only gets 1 match from each of these other "rulePools" and then moves on to the next roolPool.
// I wanted a version that would try all the rules in each rule pool. So now we have two versions of the rule pools.
// POOLED_TOGETHER_POOL_OF_RULES is used in solving steps normally, and POOL_OF_RULES is used in finding "all possible simplifications" of a node.
const POOLED_TOGETHER_POOL_OF_RULES = {
  // Convert 3.14 to 314/100 etc. in non-numerical mode.
  convertDecimalToFraction,
  // Apply logarithm rules before arithmetic to avoid huge intermediate
  // values like log10(10^23) => log10(100000000000000000000000)
  // We want log10(10^23) => 23 instead.
  commonFunctionsLogXY: commonFunctionsLogxy,
  // Basic simplifications that we always try first e.g. (...)^0 => 1
  commonRules: commonRulesPooledTogether,
  // x*a/x gives a
  cancelTerms,
  // 3x + 2x gives 5x etc.
  collectLikeTerms,
  // common function simplification e.g. sin(0) gives 0
  commonFunctions: commonFunctionsPooledTogether,
  // (a + b + c + ...) * x gives ac ax + bx + cx + ... etc.
  distribute,
  // sqrt(x^2) gives x or |x| (depends on domain)
  sqrtFromPow,
  // sqrt(n) - calculate if possible.
  sqrtFromConstant,
  // (a + b)^2 gives a^2 + 2ab + b^2 etc.
  multiplyShortFormulas,
  // Numerical result e.g. 1.414 instead of sqrt(2).
  calculateNumericalValue,
}
// Given rulesArray
const rulesArray = [
  { id: 'convertDecimalToFraction', fn: convertDecimalToFraction },
  { id: 'commonFunctionsLogXY', fn: commonFunctionsLogxy },
  ...commonRules,
  { id: 'cancelTerms', fn: cancelTerms },
  { id: 'collectLikeTerms', fn: collectLikeTerms },
  ...commonFunctions,
  // { id: 'commonFunctions', fn: require('./rules/commonFunctions') },
  { id: 'distribute', fn: distribute },
  { id: 'sqrtFromPow', fn: sqrtFromPow },
  { id: 'sqrtFromConstant', fn: sqrtFromConstant },
  { id: 'multiplyShortFormulas', fn: multiplyShortFormulas },
  { id: 'calculateNumericalValue', fn: calculateNumericalValue },
]
// Convert the array back to an object
const POOL_OF_RULES = rulesArray.reduce((acc, rule) => {
  acc[rule.id] = rule.fn
  return acc
}, {})
export { POOL_OF_RULES }
export { POOLED_TOGETHER_POOL_OF_RULES }
export default {
  POOL_OF_RULES,
  POOLED_TOGETHER_POOL_OF_RULES,
}
