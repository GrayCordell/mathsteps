export function getValueFromNodeValue(node) {
  let value = node.value?.d?.[0]?.toString()
  if (value) {
    const d1 = node.value?.d?.[1]?.toString()
    if (d1) {
      value += `---${d1}`
      const d2 = node.value?.d?.[2]?.toString()
      if (d2)
        value += `---${d2}`
    }
  }
  return value
}

function getArgsDetails(node) {
  if (!node)
    return []

  const argsDetails = []
  const stack = [node]

  while (stack.length) {
    const currentNode = stack.pop()

    const args = currentNode.args || []
    // I don't actually know if d[1] and d[2] ever exist. Not really sure how the value exists, but so far [0] seems to be the number
    const value = getValueFromNodeValue(currentNode)

    const details = {
      value,
      argLength: args.length,
      name: currentNode.name || null,
      type: currentNode.type,
      fn: currentNode.fn,
      op: currentNode.op || null,
      implicit: currentNode.implicit || null,
      properties: currentNode.properties || {},
    }

    argsDetails.push(details)

    // Push all arguments to the stack at once
    for (let i = args.length - 1; i >= 0; i--) {
      stack.push(args[i])
    }
  }

  return argsDetails
}

export function makeKeyFromNode(_node, options = {}) {
  if (!_node || options.disableCache)
    return ''

  if (typeof _node === 'string' || typeof _node === 'number' || typeof _node === 'boolean') {
    return _node.toString()
  }

  const foundNode = _node.rootNode || _node.node || _node.nodeAfter || _node

  let key = ''
  const detailsList = getArgsDetails(foundNode)
  for (const detail of detailsList) {
    key += `${detail.name || 'name:_'}${detail.type}${detail.argLength}${detail.fn || 'fn:_'}${detail.op || 'op:_'}${detail.implicit || 'implicit:_'}${detail.value || 'value:_'}`
  }
  return key
}
