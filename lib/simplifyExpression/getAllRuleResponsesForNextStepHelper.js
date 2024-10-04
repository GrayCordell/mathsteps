import clone from '~/newServices/nodeServices/clone.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { makeKeyFromNode } from '~/newServices/nodeServices/nodeCacher.js'
import { createMakeNodeFunction, isCommutative } from '~/simplifyExpression/utilMadeFromMathJs.js'
import { setUpNewNodeTree } from '../newServices/treeUtil'
import Node from '../node/index.js'
import { generateCombinations } from '../util/arrayUtils'

function _removeMultiplicationTimesSymbol(node) {
  if (!node || !node.args)
    return node
  if (node.fn !== 'multiply' || node.args.length <= 1)
    return node
  //
  // replace all alone symbols with 1 * symbol
  //
  // case first arg is a symbol
  const firstArg = node.args[0]
  if (Node.Type.isSymbol(firstArg)) {
    const oneNode = Node.Creator.constant(1)
    node.args.unshift(oneNode)
  }
  // case repeated symbol alone, then its a single symbol we need to replace
  const ogLength = node.args.length
  for (let i = 0; i < ogLength; i++) {
    const arg = node.args[i]
    const lastArg = node.args[i - 1]
    if (lastArg && Node.Type.isSymbol(arg) && Node.Type.isSymbol(lastArg)) {
      const oneNode = Node.Creator.constant(1)
      // add right before this arg
      node.args.splice(i, 0, oneNode)
    }
  }
  // Place their missing symbol as a property for later
  let lastNode = null
  node.args.forEach((arg) => {
    if (Node.Type.isSymbol(arg) && lastNode)
      lastNode.missingSymbol = arg
    lastNode = arg
  })
  // remove symbols
  node.args = node.args.filter(arg => !Node.Type.isSymbol(arg))
  return node
}
function _placeBackMultiplicationTimesSymbol(node) {
  if (!node || !node.args)
    return node
  if (node.fn !== 'multiply' || node.args.length <= 1)
    return node
  const doSymbolsExist = node.args.some(arg => Node.Type.isSymbol(arg))
  if (doSymbolsExist) {
    node.args = node.args.map((arg) => {
      arg.missingSymbol = null
      return arg
    })
    return node
  }
  const argsWithSymbolsMissing = node.args.filter(arg => arg.missingSymbol)
  // give them back their symbols
  argsWithSymbolsMissing.forEach((arg) => {
    const index = node.args.findIndex(node => node === arg)
    node.args.splice(index + 1, 0, arg.missingSymbol)
  })
  return node
}
function _getEveryFirstTwoPermutationOfNode(_node, ogTopNode, context) {
  if (!_node || !_node.args || _node.args.length < 2)
    return
  if (!isCommutative(_node))
    return [_node]
  _node = _removeMultiplicationTimesSymbol(_node)
  const makeNode = createMakeNodeFunction(_node, context)
  const combinations = generateCombinations(_node.args)
  const uniqueCombos = new Map()

  for (const combo of combinations) {
    // Changes topNode to get the new changed node
    const newNode = makeNode(combo)
    setUpNewNodeTree(context, newNode)
    const resultWithSymbolsBack = _placeBackMultiplicationTimesSymbol(clone(context.topNode))
    const nodeString = myNodeToString(resultWithSymbolsBack)
    if (!uniqueCombos.has(nodeString)) {
      uniqueCombos.set(nodeString, resultWithSymbolsBack)
    }
    // Reset context topNode to original top node to avoid mutation issues
    setUpNewNodeTree(context, ogTopNode)
  }

  return Array.from(uniqueCombos.values())
}
const permCache = new Map()
/**
 * @description This function returns all the needed permutations of the first two arguments of a node.
 * Get all permutations of the node but only the first two nodes.
 * ex. 1 + (2 * 3) + 2 =>
 * [
 *   1 + (2 * 3) + 2,
 *   (2 * 3) + 2 + 1,
 *   2 + 1 + (2 * 3)
 * ]
 */
export function getFirstOperationChoicePermutations(aNode, doesClone = true) {
  if (!aNode)
    return []
  if (!aNode.args || aNode.args.length < 2)
    return [aNode]

  const key = makeKeyFromNode(aNode)
  if (permCache.has(key))
    return permCache.get(key)
  const node = doesClone ? clone(aNode) : aNode
  const permutations = _getEveryFirstTwoPermutationOfNode(node, clone(node), { topNode: node })
  permCache.set(key, permutations)
  return permutations
}
