import { ChangeTypes } from '../../types/changeType/ChangeTypes'
import simplifyCore from '../simplifyCore.js'

const poolOfRules = [
  // Logarithm from one.
  { l: 'logXY(n, 1)', r: '0', id: ChangeTypes.KEMU_LOG_XY_FROM_ONE },
  // Example: logXY(10, 10) => 1
  { l: 'logXY(n, n)', r: '1', id: ChangeTypes.KEMU_LOG_XY_FROM_BASE },
  { l: 'logXY(c, -c)', r: '-1', id: ChangeTypes.KEMU_LOG_XY_FROM_BASE },
  { l: 'logXY(n, -n)', r: '-1', id: ChangeTypes.KEMU_LOG_XY_FROM_BASE },
  // Convert sqrt to power under logarithm.
  // Example: log10(sqrt(10)) => log10(10^1/2) => 1/2
  { l: 'logXY(n1, sqrt(n2))', r: 'logXY(n1, n2^(1/2))', id: ChangeTypes.KEMU_CONVERT_ROOT_TO_POWER },
  { l: 'logXY(n1, nthRoot(n2, n3))', r: 'logXY(n1, n2^(1/n3))', id: ChangeTypes.KEMU_CONVERT_ROOT_TO_POWER },
  // Logarithm from power.
  // Example: logXY(10, x^3) => 3 logXY(10, x)
  { l: 'logXY(n1, n2^n3)', r: 'n3 logXY(n1, n2)', id: ChangeTypes.KEMU_LOG_XY_FROM_POWER },
]
function commonFunctionsLogXY(node) {
  let rv = null
  // Possible improvement: catch many steps at once.
  const steps = simplifyCore(node, poolOfRules, null, { stopOnFirstStep: true })
  if (steps.length > 0) {
    const oneStep = steps[0]
    rv = {
      changeType: oneStep.ruleApplied.id,
      rootNode: oneStep.nodeAfter,
    }
  }
  return rv
}
export default commonFunctionsLogXY
