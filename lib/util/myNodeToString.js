import { getValueFromNodeValue, makeKeyFromNode } from '~/util/nodeCacher.js'
import { isConstantNode, isNode, isSymbolNode } from 'mathjs'
import { cleanString } from '~/util/mscStringUtils.js'

function getNodeOut(thing) {
  if (!thing)
    return null
  const node = thing.rootNode || thing.node || thing.nodeAfter || thing
  return isNode(node) ? node : null
}

const getValueFromConstantOrSymbol = (node) => {
  if (isConstantNode(node))
    return getValueFromNodeValue(node)
  if (isSymbolNode(node))
    return node.name
  return null
}

const cache = {}
const oneItemToString = (thing, options = {}, extraOptions = {}) => {
  const node = getNodeOut(thing)

  if (node) {
    const key = makeKeyFromNode(node, extraOptions)
    if (!extraOptions.disableCache && cache[key]) {
      return cache[key]
    }
    else {
      const simpleVal = getValueFromConstantOrSymbol(node)
      const str = simpleVal
        ? cleanString(simpleVal)
        : cleanString(node.toString(options))

      cache[key] = str
      return str
    }
  }
  return null
}
export function myNodeToString(unknownThing, toStringRegularOptions = undefined, extraOptions = {}) {
  // return unknownThing.toString(toStringRegularOptions)
  if (typeof unknownThing === 'object')
    return oneItemToString(unknownThing, toStringRegularOptions, extraOptions)
  else
    throw new TypeError('nodeToString only accepts objects')
}

/* function overrideToStringWithmyNodeToString(node) {
  if (node && !node.hasOverrideToString) {
    node.hasOverrideToString = true
    const originalToString = node.toString.bind(node)
    node.originalToString = originalToString
    node.toString = function (options) {
      if (this.args)
        return originalToString(options)

      return myNodeToString2(this, options)
      // originalToString(options)
    }
  }
  return node
} */
