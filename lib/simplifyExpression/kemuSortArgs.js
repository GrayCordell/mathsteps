import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import Node from '../node/index.js'

/**
 * @param {{ args: import('mathjs').MathNode[]; op: string; }} node
 * @param {string} op
 */
function _explodeNodeArgs(node, op) {
  // [2x, a, b] gives [2, x, a, b]
  /** @type {any[]} */
  let rv = []
  node.args.forEach((oneArg) => {
    if (oneArg.op === op)
      rv = rv.concat(_explodeNodeArgs(oneArg, op))
    else
      rv.push(oneArg)
  })
  return rv
}

/**
 * @param {import('mathjs').MathNode} node
 * @return {number}
 */
function _getPow(node) {
  let rv = 0
  if (Node.Type.isOperator(node)) {
    if ((node.op === '^') && Node.Type.isSymbol(node.args[0])) {
      // x^n -> the effective power is n
      // Possible improvement: Handle bignumber exponents?
      rv = Number.parseInt(node.args[1].value) // -- Grayson. Suprised this works? Isn't value an object?
    }
    else {
      // x op y - parse each argument recursively.
      // Example: 2 * x * y^3
      node.args.forEach((oneChild) => {
        rv += _getPow(oneChild)
      })
    }
  }
  else if (Node.Type.isSymbol(node)) {
    // x - the effective power is 1
    rv = 1
  }
  else if (Node.Type.isFunction(node)) {
    // Dirty workaround to move sqrt(2) like terms to the right.
    // Example: 2 + sqrt(2)
    rv = -1
  }
  return rv
}

/**
 * @param {import('mathjs').MathNode[]} nodes
 * @mutates nodes - sorts nodes by power.
 */
function _sortNodesByPow(nodes) {
  nodes.sort((a, b) => {
    const powA = _getPow(a)
    const powB = _getPow(b)
    if (powA > powB)
      return -1

    else if (powA < powB)
      return 1

    else
      return 0
  })
}


/**
 * @param {import('mathjs').MathNode[]} nodes
 * @mutates nodes - sorts nodes by power.
 */
function _sortNodesByName(nodes) {
  nodes.sort((nodeA, nodeB) => {
    let a = myNodeToString(nodeA)
    let b = myNodeToString(nodeB)
    // Dirty workaround to move sqrt(2) like factors to the right.
    if (Node.Type.isFunction(nodeA))
      a = `|fct|${a}`

    if (Node.Type.isFunction(nodeB))
      b = `|fct|${b}`

    // Compare nodes as text.
    if (a < b)
      return -1

    else if (a > b)
      return 1

    else
      return 0
  })
}

/**
 * @param {any} node
 * @mutates node - sorts node arguments.
 * @param {boolean} isVerySort - added to also do _sortNodesByName everywhere
 * @param {boolean} sortConstants - flag to enable/disable sorting of constants
 */
function _kemuSortArgs(node, isVerySort = false, sortConstants = false) {
  if (!node._kemuIsSorted) {
    // Avoid sorting the same node twice.
    node._kemuIsSorted = true
    if (node.args) {
      // Sort args recursively.
      node.args.forEach((/** @type {any} */ oneChild) => {
        _kemuSortArgs(oneChild, isVerySort, sortConstants)
      })
      switch (node.op) {
        case '*': {
        /** @type {Array<import('mathjs').MathNode>} */
          const numbers = []
          /** @type {Array<import('mathjs').MathNode>} */
          const other = []
          // Flatten nested multiply e.g. (3*x)*y =>3*x*y
          node.args = _explodeNodeArgs(node, '*')
          // Divide child into 3 groups:
          // - number constants e.g. 3.14,
          // - other nodes e.g. x + a/4
          node.args.forEach((/** @type {any} */ oneChild) => {
            if (Node.Type.isConstantOrConstantFraction(oneChild)) {
            // Constant number node e.g. 3.14
              numbers.push(oneChild)
            }
            else if (Node.Type.isUnaryMinus(oneChild)
              && Node.Type.isConstantOrConstantFraction(oneChild.args[0])) {
            // Constant negated number node e.g. -3.14
            // Possible improvement: Handle negated symbols (-x).
              numbers.push(oneChild)
            }
            else {
            // Other node e.g. (x + a/4)
              other.push(oneChild)
            }
          })
          // Sort nodes within groups.
          _sortNodesByName(other)
          if (isVerySort) // Grayson
            _sortNodesByName(numbers)
          // Join node groups in the following order:
          // | unsorted constants | sorted complex nodes |
          /** @type {import('mathjs').MathNode[]} */
          let newArgs = []
          newArgs = newArgs.concat(numbers)
          newArgs = newArgs.concat(other)
          // Apply new args order.
          node.args = newArgs
          break
        }
        case '+': {
        // Flatten nested addition e.g. (3+x)+y => 3 + x + y
          node.args = _explodeNodeArgs(node, '+')
          if (sortConstants) {
            /** @type {Array<import('mathjs').MathNode>} */
            const constants = []
            /** @type {Array<import('mathjs').MathNode>} */
            const other = []

            // Separate constants from other nodes
            node.args.forEach((oneChild) => {
              if (Node.Type.isConstantOrConstantFraction(oneChild)) {
                constants.push(oneChild)
              }
              else {
                other.push(oneChild)
              }
            })

            // Sort constants numerically if the flag is enabled
            if (sortConstants) {
              constants.sort((a, b) => {
                const valueA = Number(a.value)
                const valueB = Number(b.value)
                return valueA - valueB
              })
            }

            // Apply sorted constants and other nodes back
            node.args = constants.concat(other)

            // Sort nodes by power
            _sortNodesByPow(node.args)
            if (isVerySort) // Grayson
              _sortNodesByName(node.args)

            break
          }
          else {
            _sortNodesByPow(node.args)
            if (isVerySort) // Grayson
              _sortNodesByName(node.args)
            break
          }
        }
      }
    }
  }
  return node
}
export default _kemuSortArgs
