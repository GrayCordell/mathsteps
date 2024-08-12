import { isNode } from 'mathjs'
import { myNodeToString2 } from '~/util/myToString.js'

function getNodeOut(thing) {
  if (!thing)
    return null
  const node = thing.rootNode || thing.node || thing.nodeAfter || thing
  return isNode(node) ? node : null
}

function tempOg(unknownThing, options = {}) {
  if (typeof unknownThing === 'object') {
    const node = getNodeOut(unknownThing)
    if (!node)
      return null
    return cleanString(node.toString(options))
  }
  else {
    throw new TypeError('nodeToString only accepts objects')
  }
}

export function myNodeToString(unknownThing, options = {}, extraOptions = {}) {
  return myNodeToString2(unknownThing, options, extraOptions)
}

export function cleanStringArray(arr) {
  return arr.map(cleanString)
}
export function cleanString(str) {
  return str.replace(/\s/g, '')
}
