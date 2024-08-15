export function getValueFromNodeValue(node) {
  if (!node || !node.value || !node.value.d)
    return undefined
  return node.value.toString()
}

export function makeKeyFromNode(_node, options = {}) {
  if (!_node || options.disableCache)
    return ''

  if (typeof _node === 'string' || typeof _node === 'number' || typeof _node === 'boolean') {
    return _node.toString()
  }

  const foundNode = _node.rootNode || _node.node || _node.nodeAfter || _node
  const stack = [foundNode]
  let key = ''

  while (stack.length) {
    const currentNode = stack.pop()

    const {
      args = [],
      name = 'name:_',
      type = 'type:_',
      fn = 'fn:_',
      op = 'op:_',
      implicit = 'implicit:_',
      value,
    } = currentNode

    const nodeValue
      = value ? value.toString() : 'value:_'

    key += `${name}${type}${fn}${op}${implicit}${nodeValue}`

    for (let i = args.length - 1; i >= 0; i--) {
      stack.push(args[i])
    }
  }

  return key
}
