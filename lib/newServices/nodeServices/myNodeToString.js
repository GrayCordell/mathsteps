import { MyNodeToStringCache } from '~/cache'
import { isConstantNode, isNode, isSymbolNode } from '~/config'
import { getValueFromNodeValue, makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher.js'
import { cleanString } from '~/util/stringUtils.js'


const cache = MyNodeToStringCache
function getNode(thing) {
  return thing?.rootNode || thing?.node || thing?.nodeAfter || (isNode(thing) ? thing : null)
}

function getValueFromNode(node) {
  return isConstantNode(node)
    ? getValueFromNodeValue(node)
    : isSymbolNode(node)
      ? node.name
      : null
}

function oneItemToString(thing, options, extraOptions = {}) {
  const node = getNode(thing)
  if (!node)
    return null

  const key = makeKeyFromNode(node, extraOptions) + (options ? JSON.stringify(options) : '')
  if (!extraOptions.disableCache && cache.has(key))
    return cache.get(key)

  const value = cleanString((getValueFromNode(node) || node.toString(options ?? {})))
  if (!extraOptions.disableCache)
    cache.set(key, value)

  return value
}

/**
 * @returns {string}
 */
export function myNodeToString(unknownThing, options, extraOptions = {}) {
  if (typeof unknownThing !== 'object')
    throw new TypeError('nodeToString only accepts objects')
  return oneItemToString(unknownThing, options, extraOptions)
}
