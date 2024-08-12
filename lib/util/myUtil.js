import { createMakeNodeFunction, isCommutative } from '~/util/utilTemp.js'

function logTemp(oldRes, newRes, simplifyCtx, from, to) {
  if (newRes) {
    const id = newRes.changeType || simplifyCtx.id
    if (id)
      console.log('changeType', id)
    let oldStr = null
    if (from)
      oldStr = from
    else if (oldRes && oldRes.toString())
      oldStr = oldRes.toString()
    else if (newRes && newRes.nodeBefore)
      oldStr = newRes.nodeBefore.toString()
    let newStr = null
    if (to)
      newStr = to
    else if (simplifyCtx && simplifyCtx.rootNode && simplifyCtx.rootNode.toString())
      newStr = simplifyCtx.rootNode.toString()
    else if (newRes && newRes.nodeAfter && newRes.nodeAfter.toString())
      newStr = newRes.nodeAfter.toString()
    else if (newRes && newRes.rootNode && newRes.rootNode.toString())
      newStr = newRes.rootNode.toString()
    let alternateNewStrs = null
    if (newRes.rootNodeAlts && newRes.rootNodeAlts.length > 0) {
      const alternateNewStrsV1 = newRes.rootNodeAlts.map(step => step.toString())
      // const alternateNewStrsV2 = newRes.rootNodeAlts.map(step => step.nodeAfterStrings)[0]
      alternateNewStrs = alternateNewStrsV1
    }
    console.log('oldStr', oldStr)
    console.log('alternateNewStr', alternateNewStrs)
    // allResultOptions.add(newStr)
    console.log('newStr', newStr)
  }
}
/**
 * Get (binary) combinations of a flattened binary node
 * e.g. +(node1, node2, node3) -> [
 *        +(node1,  +(node2, node3)),
 *        +(node2,  +(node1, node3)),
 *        +(node3,  +(node1, node2))]
 *
 */
function getSplits(node, context) {
  if (!node || !node.args)
    return []
  else if (node.args.length < 2)
    return [node]
  const res = []
  let right, rightArgs
  const makeNode = createMakeNodeFunction(node)
  if (isCommutative(node, context)) {
    for (let i = 0; i < node.args.length; i++) {
      // Recursively get splits for the current node argument
      const nestedSplits = getSplits(node.args[i], context)
      // Include the original argument as well
      nestedSplits.push(node.args[i])
      for (const nestedSplit of nestedSplits) {
        rightArgs = node.args.slice(0)
        rightArgs.splice(i, 1)
        right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
        res.push(makeNode([nestedSplit, right]))
      }
    }
  }
  else {
    const nestedSplits = getSplits(node.args[0], context)
    nestedSplits.push(node.args[0])
    for (const nestedSplit of nestedSplits) {
      rightArgs = node.args.slice(1)
      right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
      res.push(makeNode([nestedSplit, right]))
    }
  }
  return res
}
/* function myNodeToString(unknownThing) {
  const toStringFn = (thing) => {
    if (thing && thing.rootNode)
      return thing.rootNode.toString()
    else if (thing && thing.nodeAfter)
      return thing.nodeAfter.toString()
    else if (thing && thing.node)
      return thing.node.toString()
    if (thing && thing.toString) {
      const toString = thing.toString()
      if (toString.toLowerCase().includes('[object'))
        return thing
      else
        return thing.toString()
    }
    return thing
  }
  if (typeof unknownThing === 'string') {
    return unknownThing.replace(/\s/g, '')
  }
  else if (Array.isArray(unknownThing)) {
    return unknownThing.map(v => toStringFn(v).replace(/\s/g, ''))
  }
  else if (typeof unknownThing === 'object') {
    let tryToStr = toStringFn(unknownThing)
    if (typeof tryToStr === 'string' && tryToStr.toLowerCase().includes('[object'))
      tryToStr = null
    return typeof tryToStr === 'string' ? tryToStr.replace(/\s/g, '') : tryToStr
  }
} */
function cleanermyNodeToString(equation) {
  const eqAsString = myNodeToString(equation)
  // Define the regex pattern to match number * variable
  const pattern = /(\d+)\s*\*\s*([a-z]+)/gi
  // Use the replace method with a callback to format the match
  let numberVariablizedString = eqAsString.replace(pattern, (match, number, variable) => {
    return number + variable
  })
  numberVariablizedString = numberVariablizedString.replaceAll('*', ' * ')
  numberVariablizedString = numberVariablizedString.replaceAll('+', ' + ')
  numberVariablizedString = numberVariablizedString.replaceAll('-', ' + ')
  return numberVariablizedString
}
// Temporary dev functions
// global.dev_clean = myToString;
// global.dev_clean2 = cleanerMyToString;
// global.clean_dev = myToString;
// global.clean_dev2 = cleanerMyToString;
// global.dev_myToString = myToString;
// global.myToString_dev = myToString;
// global.myToString_dev2 = cleanerMyToString;
function roughSizeOfObject(object) {
  const objectList = []
  const stack = [object]
  let bytes = 0
  while (stack.length) {
    const value = stack.pop()
    switch (typeof value) {
      case 'boolean':
        bytes += 4
        break
      case 'string':
        bytes += value.length * 2
        break
      case 'number':
        bytes += 8
        break
      case 'object':
        if (!objectList.includes(value)) {
          objectList.push(value)
          for (const prop in value) {
          // eslint-disable-next-line no-prototype-builtins
            if (value.hasOwnProperty(prop))
              stack.push(value[prop])
          }
        }
        break
    }
  }
  return bytes
}
export { roughSizeOfObject }
export { logTemp }
export { getSplits }
export { cleanerMyToString }
export default {
  roughSizeOfObject,
  logTemp,
  getSplits,
  myToString,
  cleanerMyToString,
}
