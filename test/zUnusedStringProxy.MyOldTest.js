/*
import { describe, it } from 'vitest'
import { math } from '~/config'
import { isOperatorNode } from 'mathjs'

describe('temp', () => {
  function createProxy(target, onChange) {
    const handler = {
      get(target, property, receiver) {
        const value = target[property]
        if (typeof value === 'object' && value !== null) {
          if (!value._isProxy)
            target[property] = createProxy(value, onChange)

          return target[property]
        }
        return value
      },
      set(target, property, value, receiver) {
        if (property === '_isProxy' || property === '_isCachingAttached' || property === 'hasChanged' || property === 'cachedString' || property === 'cachedParenthesisString') {
          target[property] = value
        }
        else if (target[property] !== value) {
          onChange()
          target[property] = value
          if (typeof value === 'object' && value !== null)
            target[property] = createProxy(value, onChange)

          target.hasChanged = true
        }
        return true
      },
      deleteProperty(target, property) {
        if (property in target) {
          onChange()
          delete target[property]
          target.hasChanged = true
        }
        return true
      },
    }

    target._isProxy = true
    target.hasChanged = false
    return new Proxy(target, handler)
  }

  const refMap = new Map()
  const refMap2 = new Map()

  function attachToStringCaching(node) {
    if (node._isCachingAttached || !isOperatorNode(node))
      return node

    const originalToString = node.toString.bind(node)
    node.cachedString = null
    node.cachedParenthesisString = null

    node.toString = function (options = {}) {
      const wantsParenthesis = options.parenthesis !== 'none'
      if (wantsParenthesis) {
        if (this.cachedParenthesisString === null) {
          if (this.hasChanged === false && refMap.has(this))
            this.cachedParenthesisString = refMap.get(this)
          else
            this.cachedParenthesisString = originalToString(options)
        }
        refMap.set(this, this.cachedParenthesisString)
        node.resetHasChanged()
        return this.cachedParenthesisString
      }
      else {
        if (this.cachedString === null) {
          if (this.hasChanged === false && refMap2.has(this))
            this.cachedString = refMap2.get(this)
          else
            this.cachedString = originalToString(options)
        }
        refMap2.set(this, this.cachedString)
        node.resetHasChanged()
        return this.cachedString
      }
    }

    node.resetHasChanged = function () {
      this.hasChanged = false
      for (const key in this) {
        if (this.hasOwnProperty(key) && typeof this[key] === 'object' && this[key] !== null) {
          if (this[key].resetHasChanged)
            this[key].resetHasChanged()
        }
      }
    }

    for (const key in node) {
      if (node.hasOwnProperty(key) && typeof node[key] === 'object' && node[key] !== null)
        node[key] = attachToStringCaching(node[key])
    }

    const proxiedNode = createProxy(node, () => {
      node.cachedString = null
      node.cachedParenthesisString = null
      node.hasChanged = true // Ensure parent node's hasChanged is set to true when any subNode changes
    })

    proxiedNode._isCachingAttached = true
    return proxiedNode
  }

  // Usage example
  let node = math.parse('a + b')
  node = attachToStringCaching(node)

  console.log(node.toString()) // Computes and caches the string with parenthesis
  // node.args[1].content.args[0] = math.parse('c') // Invalidate the cache by changing the node
  console.log(node.toString({ parenthesis: 'none' })) // Computes and caches the new string with parenthesis

  node.args[0] = math.parse('d') // Another change to invalidate the cache
  console.log(node.toString({ parenthesis: 'none' })) // Computes and caches the new string without parenthesis
  console.log(node.toString({ parenthesis: 'all' })) // Reuses the cached string with parenthesis

  it(`temp`, () => true)
})
*/
