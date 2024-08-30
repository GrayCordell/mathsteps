import ChangeTypes from '../../types/ChangeTypes'
import Node from '../../node/index.js'
import clone from '~/newServices/nodeServices/clone.js'
import math from '~/config'

function sqrtFromPow(node, simplifyCtx) {
  let rv = null
  // eslint-disable-next-line eqeqeq
  if (Node.Type.isFunction(node, 'sqrt') && node.args[0].op == '^') {
    const root = node.args[0].args[0]
    const exponent = node.args[0].args[1]
    if (Node.Type.isConstant(exponent)) {
      const exponentValue = exponent.value
      const exponentMod2 = math.mod(exponentValue, 2)
      const exponentMod4 = math.mod(exponentValue, 4)
      if (math.equal(exponentMod2, 0)) {
        // sqrt(x^2)     gives |x|   or x
        // sqrt(x^(2*n)) gives |x|^n or x^n
        let newNode = null
        let rootIsNonNegative = false
        if (simplifyCtx.expressionCtx)
          rootIsNonNegative = simplifyCtx.expressionCtx.isNodeNonNegative(root)

        if (math.equal(exponentValue, 2)) {
          // sqrt(x^2)
          if (rootIsNonNegative) {
            // sqrt(x^2) gives x if x>=0
            newNode = clone(root)
          }
          else {
            // sqrt(x^2) gives |x| if x can be negative
            newNode = Node.Creator.kemuCreateAbs(root)
          }
        }
        else if (rootIsNonNegative || math.equal(exponentMod4, 0)) {
          // sqrt(x^2n) gives x^n if x>=0
          // sqrt(x^4n) gives x^2n for any x
          const newExponent = Node.Creator.operator('/', [clone(exponent), Node.Creator.constant(2)])
          newNode = Node.Creator.operator('^', [clone(root), newExponent])
        }
        if (newNode) {
          rv = {
            changeType: ChangeTypes.KEMU_SQRT_FROM_POW,
            rootNode: newNode,
          }
        }
      }
    }
  }
  return rv
}
export default sqrtFromPow
