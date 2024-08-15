import { describe, it } from 'vitest'
import { math } from '~/config.js'
import simplifyCommon from '~/simplifyExpression/_common.js'

describe('temp', () => {
  // Function to traverse and modify nodes efficiently
  function traverseAndModify(rootNode, modifyFn, logFn) {
    rootNode.traverse((node, path, parent) => {
      if (parent) {
        // Apply the modification function
        const modifiedNode = modifyFn(node)

        if (modifiedNode !== node) {
          // Replace the node in the parent if modification occurred
          replaceNode(parent, node, modifiedNode)

          // Log the current state of the expression if a logging function is provided
          if (logFn) {
            logFn(rootNode.toString())
          }

          // Revert the modification immediately to avoid unnecessary cloning
          replaceNode(parent, modifiedNode, node)
        }
      }
    })
  }

  // Function to replace a node in its parent
  function replaceNode(parent, oldNode, newNode) {
    if (parent.isOperatorNode || parent.isFunctionNode) {
      parent.args = parent.args.map(arg => (arg === oldNode ? newNode : arg))
    }
    else if (parent.isParenthesisNode) {
      parent.content = newNode
    }
    else if (parent.isAccessorNode) {
      parent.object = parent.object === oldNode ? newNode : parent.object
      parent.index = parent.index === oldNode ? newNode : parent.index
    }
    else if (parent.isArrayNode) {
      parent.items = parent.items.map(item => (item === oldNode ? newNode : item))
    }
    else if (parent.isAssignmentNode) {
      if (parent.value === oldNode) {
        parent.value = newNode
      }
      else if (parent.object === oldNode) {
        parent.object = newNode
      }
    }
    else if (parent.isConditionalNode) {
      if (parent.condition === oldNode) {
        parent.condition = newNode
      }
      else if (parent.trueExpr === oldNode) {
        parent.trueExpr = newNode
      }
      else if (parent.falseExpr === oldNode) {
        parent.falseExpr = newNode
      }
    }
    else if (parent.isOperatorNode) {
      parent.args = parent.args.map(arg => (arg === oldNode ? newNode : arg))
    }
    else if (parent.isFunctionNode) {
      parent.args = parent.args.map(arg => (arg === oldNode ? newNode : arg))
    }
  }

  // Example modify function: Replace all operators with a different operator (e.g., change "+" to "*")
  function replaceOperators(node) {
    if (node.isOperatorNode && node.op === '+') {
      return new math.OperatorNode('*', 'multiply', [node.args[0], node.args[1]])
    }
    return node
  }

  // Example logging function
  function logExpression(expression) {
    console.log(expression)
  }

  // Parse the expression
  const expression = '2 + 3 + 4'
  let rootNode = math.parse(expression)
  rootNode = simplifyCommon.kemuFlatten(rootNode)
  // Apply the traverse and modify function with operator replacement
  traverseAndModify(rootNode, replaceOperators, logExpression)

  it(`temp`, () => true)
})
