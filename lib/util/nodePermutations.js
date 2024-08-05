const _util = require('mathjs/lib/function/algebra/simplify/util')
const {math} = require('../../config')
const clone = require('./clone')
const {generateCombinations} = require('./arrayUtils')
const {setUpNewNodeTree} = require('./treeUtil')
const {removeImplicitMultiplicationFromNode} = require('../simplifyExpression/myIndexHelpers')
const Node = require('../node')
const {filterUniqueValues} = require('./arrayUtils')
const {myToString} = require('./myUtil')


// / These here are just for getSplits for now
const FunctionNode    = math.FunctionNode
const OperatorNode    = math.OperatorNode
const SymbolNode      = math.SymbolNode
const _createUtil = (0, _util.createUtil)({
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  SymbolNode: SymbolNode
})

const createMakeNodeFunction = _createUtil.createMakeNodeFunction
const isCommutative = _createUtil.isCommutative


function removeMultiplicationTimesSymbol(node){
  if(!node || !node.args)
    return node
  if(node.fn !== 'multiply' || node.args.length <= 1)
    return node


  //
  // replace all alone symbols with 1 * symbol
  //
  // case first arg is a symbol
  const firstArg = node.args[0]
  if(Node.Type.isSymbol(firstArg)){
    const oneNode = Node.Creator.constant(1)
    node.args.unshift(oneNode)
  }
  // case repeated symbol alone, then its a single symbol we need to replace
  const ogLength = node.args.length
  for(let i = 0; i < ogLength; i++){
    const arg = node.args[i]
    const lastArg = node.args[i - 1]
    if(lastArg && Node.Type.isSymbol(arg) && Node.Type.isSymbol(lastArg)){
      const oneNode = Node.Creator.constant(1)
      // add right before this arg
      node.args.splice(i,0,oneNode)
    }
  }


  // Place their missing symbol as a property for later
  let lastNode = null
  node.args.forEach((arg)=>{
    if(Node.Type.isSymbol(arg) && lastNode)
      lastNode.missingSymbol = arg
    lastNode = arg
  })
  // remove symbols
  node.args = node.args.filter((arg)=> !Node.Type.isSymbol(arg))

  return node
}
function placeBackMultiplicationTimesSymbol(node){
  if(!node || !node.args)
    return node
  if(node.fn !== 'multiply' || node.args.length <= 1)
    return node


  const doSymbolsExist = node.args.some((arg)=>Node.Type.isSymbol(arg))
  if(doSymbolsExist){
    node.args = node.args.map((arg)=>{
      arg.missingSymbol = null
      return arg
    })
    return node
  }

  const argsWithSymbolsMissing = node.args.filter((arg)=>arg.missingSymbol)
  // give them back their symbols
  argsWithSymbolsMissing.forEach((arg)=>{
    const index = node.args.findIndex((node)=>node === arg)
    node.args.splice(index + 1,0,arg.missingSymbol)
  })


  return node
}

function _getEveryFirstTwoPermutationOfNode(_node,ogTopNode,context){
  if (!_node || !_node.args || _node.args.length < 2)
    return
  if (!isCommutative(_node))
    return [_node]


  _node =  removeImplicitMultiplicationFromNode(_node)
  _node = removeMultiplicationTimesSymbol(_node)
  const ogRootNode = clone(_node)


  let makeNode = createMakeNodeFunction(_node, context)
  const fullNodeCombo = new Map()

  let combinations = generateCombinations(_node.args)
  let nodesCombos = combinations
   .map((combo) => makeNode(combo))
  nodesCombos = filterUniqueValues(nodesCombos,(a,b)=>myToString(a) === myToString(b))

   // .map((combo)=>placeBackMultiplicationTimesSymbol(combo))

  nodesCombos.forEach((newNode)=>{
        // Changes topNode to get the new changed node
    setUpNewNodeTree(context,newNode)

    const isTopNodeAValueType = (context.topNode.value && !context.topNode.args)
    const result = isTopNodeAValueType
            ? context.topNode.value
            : context.topNode
    const resultWithSymbolsBack = placeBackMultiplicationTimesSymbol(clone(result))

    fullNodeCombo.set(resultWithSymbolsBack.toString(),resultWithSymbolsBack)

        // reset topNode and rootNode
    setUpNewNodeTree(context,ogRootNode,ogTopNode)
  })


  return Array.from(fullNodeCombo.values())
}


/**
 *
 * @param node
 * @returns {*|*[]|null}
 * @description This function returns all the needed permutations of the first two arguments of a node.
 * Kind of hard to explain. But it aligns at this node level every possible first 2 operations usable so we can try every match later.
 *
 */
const cache = new Map()
function getFirstOperationChoicePermutations(aNode,doesClone = true) {
  if(!aNode)
    return []
  if(!aNode.args || aNode.args.length < 2)
    return [aNode]

  if(cache.has(aNode.toString()))
    return cache.get(aNode.toString())

  let node = doesClone ? clone(aNode) : aNode

  node = removeImplicitMultiplicationFromNode(node)
  const ogTopNode = clone(node)
  let startLvlUsefulPermutations =  _getEveryFirstTwoPermutationOfNode(node,ogTopNode,{ topNode: node })
  cache.set(node.toString(),startLvlUsefulPermutations)
  return startLvlUsefulPermutations

}


module.exports = {
  getFirstOperationChoicePermutations: getFirstOperationChoicePermutations,
}


/*
// const makeNode = createMakeNodeFunction(node)
    // const onesWithMultFirstCombosArrangedWithTheOperationsFirst = _getOnesWithMultOperatorsFirst(startLvlUsefulPermutations).map((fNode)=>{
    //   const ogTopNode = clone(node)
    //   const firstArg = fNode.args[0]
    //   const fullNodeComboArray = _getEveryFirstTwoPermutationOfNode(firstArg,ogTopNode,{ topNode: firstArg })
    //   return fullNodeComboArray.map((newNode)=>{
    //     const restOfFNodeArgs = fNode.args.slice(1)
    //     return makeNode([newNode,...restOfFNodeArgs])
    //   })
    // })
    // return startLvlUsefulPermutations.concat(onesWithMultFirstCombosArrangedWithTheOperationsFirst.flat())
 Maybe use later?
function _getOnesWithMultOperatorsFirst(nodeArray){
  const newNodeArray = nodeArray.map((node)=>clone(node))

  let foundOperatorsInFirstTwo = new Map()
  const filteredNodeArray = newNodeArray.filter(node=>{
    if(!isOperatorNode(node) || !node.args)
      return false

    const firstTwoArgs = [node.args[0],node.args[1]]
    let firstTwoArgsThatAreOperators = firstTwoArgs.filter((arg)=>isOperatorNode(arg))
    if(firstTwoArgsThatAreOperators && firstTwoArgsThatAreOperators.length > 0)
      return true
  })
  filteredNodeArray.forEach((node)=>{
    const firstNode  = node.args[0]
    const secondNode  = node.args[1]
    const firstArgStr = myToString(firstNode)
    const secondArgStr = myToString(secondNode)
    if(isOperatorNode(firstNode))
      foundOperatorsInFirstTwo.set(firstArgStr,node)
    if(isOperatorNode(secondNode))
      foundOperatorsInFirstTwo.set(secondArgStr,node)
  })

  const finalNodesWithOperatorsFirst = []
  foundOperatorsInFirstTwo.forEach((node,key)=>{
    const valueWeWantToFind = key
    const firstNode = node.args[0]
    const secondNode = node.args[1]
    const firstArgStr = myToString(firstNode)
    const secondArgStr = myToString(secondNode)

    if(firstArgStr === valueWeWantToFind){
      finalNodesWithOperatorsFirst.push(node)
    }
    if(secondArgStr === valueWeWantToFind){
      const newNode = clone(node)
      newNode.args[0] = secondNode
      newNode.args[1] = firstNode
      finalNodesWithOperatorsFirst.push(newNode)
    }
  })
  return finalNodesWithOperatorsFirst
}
*/
