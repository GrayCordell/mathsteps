export function roughSizeOfObject(object) {
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
