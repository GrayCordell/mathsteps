/*
const print = require('../util/print')
const clone = require('../util/clone')
const simplifyCommon = require('./_common')
const {travelTreeExpanded}=require('../util/treeUtil');

function _replaceChildNodeAfterClone(originalRoot, clonedRoot, nodeToBeReplaced, nodeToPut) {
  let rv = clonedRoot

  if (originalRoot == nodeToBeReplaced) {
    rv = nodeToPut

  } else if (originalRoot.args) {
    for (let idx in originalRoot.args) {
      clonedRoot.args[idx] = _replaceChildNodeAfterClone(
                originalRoot.args[idx],
                clonedRoot.args[idx],
                nodeToBeReplaced,
                nodeToPut
            )
    }
  }

  return rv
}
// /

function removeImplicitMultiplicationFromNode(node) {
  travelTreeExpanded(node,(_node)=>{
    if(_node.implicit)
      _node.implicit = false
  })
  return node
}
function fullNormalizeNode(node, doNotMutate = false){
  const _node = node.rootNode || node
  let theNode = doNotMutate ? clone(_node) : _node
  theNode = simplifyCommon.kemuFlatten(theNode)
  theNode = simplifyCommon.kemuNormalizeConstantNodes(theNode)
  theNode = removeImplicitMultiplicationFromNode(theNode)

  return theNode
}
function handleAltFormProcedure(stepMeta,oldNode,simplifyCtxNode){
  if(!stepMeta || !stepMeta.altForms)
    return
  stepMeta.altForms.forEach((oneAltForm) => {
    const altFormNodeRoot  = clone(oldNode)
    const nodeToBeReplaced = simplifyCtxNode.lastChangedActiveNode[simplifyCtxNode.lastChangedActiveNodeIdx]
    const nodeToPut        = oneAltForm.node

        // Build whole altForm node by clonning root and replace changed
        // node only.
    oneAltForm.node = _replaceChildNodeAfterClone(
            simplifyCtxNode.rootNode,
            altFormNodeRoot,
            nodeToBeReplaced,
            nodeToPut
        )
  })
}
function resetCurrentNodeToRoot(simplifyCtxNode) {
    // Reset current node to the root.
  simplifyCtxNode.lastChangedActiveNode    = null
  simplifyCtxNode.lastChangedActiveNodeIdx    = null
  simplifyCtxNode.lastChangedActiveNodeParent = null
}

const shallowRefCopyNodeCTX = (ogNode)=>({
  ...ogNode,
  iterIdx:ogNode.iterIdx,
  // lastChangedActiveNode:ogNode.lastChangedActiveNode,
  // lastChangedNodeIdx:ogNode.lastChangedNodeIdx,
  // lastChangedNodeParent:ogNode.lastChangedNodeParent,
  rootNode: ogNode.rootNode ? clone(ogNode.rootNode) : null,
  // for simplifyCtxNode
  isDryRun:ogNode.isDryRun,
  isWithAlternativeRun:ogNode.isWithAlternativeRun,
})

// /////
function logSteps(nodeStatus,node, expressionCtx, rootNode){
    // eslint-disable-next-line
    console.log(nodeStatus.changeType);
    // eslint-disable-next-line
    console.log(print.ascii(nodeStatus.rootNode));

  if (nodeStatus && nodeStatus.substeps && nodeStatus.substeps.length > 0) {
        // eslint-disable-next-line
        console.log('substeps: ');
    nodeStatus.substeps.forEach((substep, idx) => {
      console.log('...', idx, '|', print.ascii(substep.rootNode))
    })
  }
}

module.exports = {
  _replaceChildNodeAfterClone,
  logSteps,
  fullNormalizeNode,
  removeImplicitMultiplicationFromNode,
  handleAltFormProcedure,
  resetCurrentNodeToRoot,
  shallowRefCopyNodeCTX,
}
*/
