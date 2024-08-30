/* eslint-disable prefer-rest-params ---- */
import { isOperatorNode } from '~/config'
import { isFunctionNode, isParenthesisNode } from 'mathjs'

/**
 * A safe hasOwnProperty
 * @param {object} object
 * @param {string} property
 */
export function hasOwnProperty(object, property) {
  return object && Object.hasOwnProperty.call(object, property)
}

////////

function ownKeys(e, r) {
  const t = Object.keys(e)
  if (Object.getOwnPropertySymbols) {
    let o = Object.getOwnPropertySymbols(e)
    if (r) {
      o = o.filter((r) => {
        return Object.getOwnPropertyDescriptor(e, r).enumerable
      })
    }
    // eslint-disable-next-line prefer-spread
    t.push.apply(t, o)
  }
  return t
}

function _objectSpread(target) {
  for (let i = 1; i < arguments.length; i++) {
    const source = arguments[i] != null ? arguments[i] : {}

    if (i % 2) {
      ownKeys(Object(source), true).forEach((key) => {
        target[key] = source[key] // Direct assignment
      })
    }
    else {
      if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
      }
      else {
        ownKeys(Object(source)).forEach((key) => {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
        })
      }
    }
  }
  return target
}

export const createUtil = (_ref) => {
  const {
    FunctionNode,
    OperatorNode,
    SymbolNode,
  } = _ref

  const T = true
  const F = false
  const defaultName = 'defaultF'
  const defaultContext = {
    add: { trivial: T, total: T, commutative: T, associative: T },
    unaryPlus: { trivial: T, total: T, commutative: T, associative: T },
    subtract: { trivial: F, total: T, commutative: F, associative: F },
    multiply: { trivial: T, total: T, commutative: T, associative: T },
    divide: { trivial: F, total: T, commutative: F, associative: F },
    paren: { trivial: T, total: T, commutative: T, associative: F },
    defaultF: { trivial: F, total: T, commutative: F, associative: F },
  }
  const realContext = {
    divide: { total: F },
    log: { total: F },
  }
  const positiveContext = {
    subtract: { total: F },
    abs: { trivial: T },
    log: { total: T },
  }

  function hasProperty(nodeOrName, property, context = defaultContext) {
    let name = defaultName
    if (typeof nodeOrName === 'string') {
      name = nodeOrName
    }
    else if (isOperatorNode(nodeOrName)) {
      name = nodeOrName.fn.toString()
    }
    else if (isFunctionNode(nodeOrName)) {
      name = nodeOrName.name
    }
    else if (isParenthesisNode(nodeOrName)) {
      name = 'paren'
    }

    if (hasOwnProperty(context, name)) {
      const properties = context[name]
      if (hasOwnProperty(properties, property)) {
        return properties[property]
      }
      if (hasOwnProperty(defaultContext, name)) {
        return defaultContext[name][property]
      }
    }
    if (hasOwnProperty(context, defaultName)) {
      const _properties = context[defaultName]
      if (hasOwnProperty(_properties, property)) {
        return _properties[property]
      }
      return defaultContext[defaultName][property]
    }
    if (hasOwnProperty(defaultContext, name)) {
      const _properties2 = defaultContext[name]
      if (hasOwnProperty(_properties2, property)) {
        return _properties2[property]
      }
    }
    return defaultContext[defaultName][property]
  }

  function isCommutative(node, context = defaultContext) {
    return hasProperty(node, 'commutative', context)
  }

  function isAssociative(node, context = defaultContext) {
    return hasProperty(node, 'associative', context)
  }

  function mergeContext(primary, secondary) {
    const merged = _objectSpread({}, primary)
    for (const prop in secondary) {
      if (hasOwnProperty(primary, prop)) {
        merged[prop] = _objectSpread({}, secondary[prop], primary[prop])
      }
      else {
        merged[prop] = secondary[prop]
      }
    }
    return merged
  }

  function flatten(node, context) {
    if (!node.args || node.args.length === 0) {
      return node
    }
    node.args = allChildren(node, context)
    for (let i = 0; i < node.args.length; i++) {
      flatten(node.args[i], context)
    }
  }

  function allChildren(node, context) {
    let op
    const children = []
    const findChildren = function findChildren(node) {
      for (let i = 0; i < node.args.length; i++) {
        const child = node.args[i]
        if (isOperatorNode(child) && op === child.op) {
          findChildren(child)
        }
        else {
          children.push(child)
        }
      }
    }
    if (isAssociative(node, context)) {
      op = node.op
      findChildren(node)
      return children
    }
    else {
      return node.args
    }
  }

  function unflattenr(node, context) {
    if (!node.args || node.args.length === 0) {
      return
    }
    const makeNode = createMakeNodeFunction(node)
    const l = node.args.length
    for (let i = 0; i < l; i++) {
      unflattenr(node.args[i], context)
    }
    if (l > 2 && isAssociative(node, context)) {
      let curnode = node.args.pop()
      while (node.args.length > 0) {
        curnode = makeNode([node.args.pop(), curnode])
      }
      node.args = curnode.args
    }
  }

  function unflattenl(node, context) {
    if (!node.args || node.args.length === 0) {
      return
    }
    const makeNode = createMakeNodeFunction(node)
    const l = node.args.length
    for (let i = 0; i < l; i++) {
      unflattenl(node.args[i], context)
    }
    if (l > 2 && isAssociative(node, context)) {
      let curnode = node.args.shift()
      while (node.args.length > 0) {
        curnode = makeNode([curnode, node.args.shift()])
      }
      node.args = curnode.args
    }
  }

  function createMakeNodeFunction(node) {
    if (isOperatorNode(node)) {
      return function (args) {
        try {
          return new OperatorNode(node.op, node.fn, args, node.implicit)
        }
        catch (err) {
          console.error(err)
          return []
        }
      }
    }
    else {
      return function (args) {
        return new FunctionNode(new SymbolNode(node.name), args)
      }
    }
  }

  return {
    createMakeNodeFunction,
    hasProperty,
    isCommutative,
    isAssociative,
    mergeContext,
    flatten,
    allChildren,
    unflattenr,
    unflattenl,
    defaultContext,
    realContext,
    positiveContext,
  }
}
