import { isConstantNode, isNode, isSymbolNode } from '~/config'
import { getValueFromNodeValue, makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher.js'
import { cleanString } from '~/util/stringUtils.js'

const cache = {}

function getNode(thing) {
  return thing?.rootNode || thing?.node || thing?.nodeAfter || (isNode(thing) ? thing : null)
}

function getValueFromNode(node) {
  return isConstantNode(node) ? getValueFromNodeValue(node) : isSymbolNode(node) ? node.name : null
}

function oneItemToString(thing, options, extraOptions = {}) {
  const node = getNode(thing)
  if (!node)
    return null

  const key = makeKeyFromNode(node, extraOptions) + (options ? JSON.stringify(options) : '')
  if (!extraOptions.disableCache && cache[key])
    return cache[key]

  const value = getValueFromNode(node) || node.toString(options ?? {})
  return (cache[key] = cleanString(value))
}

export function myNodeToString(unknownThing, options, extraOptions = {}) {
  if (typeof unknownThing !== 'object')
    throw new TypeError('nodeToString only accepts objects')
  return oneItemToString(unknownThing, options, extraOptions)
}
