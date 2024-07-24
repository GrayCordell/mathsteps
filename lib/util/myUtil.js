const simplifyCore = require('../simplifyExpression/simplifyCore')
const _util = require('mathjs/lib/function/algebra/simplify/util')
const {math} = require('../../config')
const clone = require('../util/clone')

// const IS_DRY_RUN = true
// const repetitionMap = new Map()
// let allResultOptions = new Set()
// function conditionalDryRunLog(newRes) {
//   if(IS_DRY_RUN)
//     return null
//   return newRes
// }
function logTemp (oldRes, newRes,simplifyCtx,from, to ){
  if(newRes) {
    const id = newRes.changeType || simplifyCtx.id
    if(id)
      console.log('changeType', id)

    let oldStr = null
    if(from)
      oldStr = from
    else if(oldRes && oldRes.toString())
      oldStr = oldRes.toString()
    else if(newRes && newRes.nodeBefore)
      oldStr = newRes.nodeBefore.toString()

    let newStr = null
    if(to)
      newStr = to
    else if(simplifyCtx && simplifyCtx.rootNode && simplifyCtx.rootNode.toString())
      newStr = simplifyCtx.rootNode.toString()
    else if(newRes && newRes.nodeAfter && newRes.nodeAfter.toString())
      newStr = newRes.nodeAfter.toString()
    else if(newRes && newRes.rootNode && newRes.rootNode.toString())
      newStr = newRes.rootNode.toString()


    let alternateNewStrs = null
    if(newRes.rootNodeAlts && newRes.rootNodeAlts.length > 0) {
      const alternateNewStrsV1 = newRes.rootNodeAlts.map(step => step.toString())
      const alternateNewStrsV2 = newRes.rootNodeAlts.map(step => step.nodeAfterStrings)[0]
      alternateNewStrs = alternateNewStrsV1
    }

    console.log('oldStr', oldStr)
    console.log('alternateNewStr', alternateNewStrs)
    // allResultOptions.add(newStr)
    console.log('newStr', newStr)
  }
}
function wrapObject(state) {
  const handler = {
    get: function(obj, prop) {
      console.log('get invoked for prop:: ', prop)
      return prop
    },
    set: function(obj, prop, value) {
      console.log('set invoked for prop:: ', prop, ' and value:: ', value)
    }
  }
  // eslint-disable-next-line no-undef
  return new Proxy(state, handler)
}
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

/**
 * Get (binary) combinations of a flattened binary node
 * e.g. +(node1, node2, node3) -> [
 *        +(node1,  +(node2, node3)),
 *        +(node2,  +(node1, node3)),
 *        +(node3,  +(node1, node2))]
 *
 */
function getSplits(node, context) {
  if(!node || !node.args)
    return []
  else if(node.args.length < 2)
    return [node]

  let res = []
  let right, rightArgs
  let makeNode = createMakeNodeFunction(node)

  if (isCommutative(node, context)) {
    for (let i = 0; i < node.args.length; i++) {
      rightArgs = node.args.slice(0)
      rightArgs.splice(i, 1)
      right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
      res.push(makeNode([node.args[i], right]))
    }
  } else {
    rightArgs = node.args.slice(1)
    right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
    res.push(makeNode([node.args[0], right]))
  }

  return res
}


// function to print the tree structure in the console
function printTree(node, prefix = '', isLeft = true, isStart = true) {
  let newNode = node
  if (!newNode)
    return
  if(isStart){
    console.log('_______________________________')
    console.log('Root Node: ', newNode.toString())
  }

  const operatorNodes = ['OperatorNode', 'FunctionNode']
  const isOperator = operatorNodes.includes(newNode.type)

  let currentNodeRepresentation = ''
  if (isOperator) {
    currentNodeRepresentation = newNode.op || newNode.fn
  } else if (newNode.type === 'SymbolNode') {
    currentNodeRepresentation = newNode.name
  } else if (newNode.type === 'ConstantNode') {
    currentNodeRepresentation = newNode.value
  }

  console.log(prefix + (isLeft ? '├── ' : '└── ') + currentNodeRepresentation)

  if (newNode.args) {
    for (let i = 0; i < newNode.args.length - 1; i++) {
      printTree(newNode.args[i],prefix + (isLeft ? '│   ' : '    '), true, false)
    }
    if (newNode.args.length > 0) {
      printTree(newNode.args[newNode.args.length - 1], prefix + (isLeft ? '│   ' : '    '), false,false)
    }
  }
}

function travelTree(node, fn,context = {}){
  context = context || {}
  context.visited = context.visited || new Set()

  if (node.args) {
    node.args.forEach((arg) => {
      travelTree(arg, fn)
    })
  }
  fn(node)
}


module.exports = {logTemp,wrapObject,getSplits,printTree,travelTree}
