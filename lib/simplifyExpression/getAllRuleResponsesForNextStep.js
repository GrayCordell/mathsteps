import clone from '~/newServices/nodeServices/clone.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import checks from '../checks/index.js'
import { setUpNewNodeTree, travelTreeExpanded } from '../newServices/treeUtil'
import { ChangeTypes } from '../types/changeType/ChangeTypes'
import print from '../util/print.js'
import { getFirstOperationChoicePermutations } from './getAllRuleResponsesForNextStepHelper.js'
import { kemuFlatten } from './kemuSimplifyCommonServices.js'
import kemuSortArgs from './kemuSortArgs.js'
import { POOL_OF_RULES } from './theIndexRulePool.js'

function getAllRuleResponsesForNextStep(node, options = {}) {
  // Pre-process node.
  node = kemuFlatten(node)
  // Add hard-coded first step with original expression.
  if (options.onStepCb)
    options.onStepCb({ changeType: ChangeTypes.KEMU_ORIGINAL_EXPRESSION, rootNode: clone(node) })
  const isAllowed = !checks.hasUnsupportedNodes(node)
  if (!isAllowed)
    return
    // Apply simplify rules to the expression.
  const originalNode = clone(node)
  const oldNode0 = originalNode
  const root = node
  // Apply common rules first.
  for (const [ruleId, fct] of Object.entries(POOL_OF_RULES)) {
    if (options[`disable${ruleId}`])
      continue
    const res = getAllResponsesForRule(fct, root, options)
    if (res)
      options.onStepCb(res)
  }
  //
  // Post-process node.
  //
  node = oldNode0
  // Possible improvement: Optimize it.
  const newNode = kemuSortArgs(clone(oldNode0))
  const oldNodeAsText = print.ascii(oldNode0)
  const newNodeAsText = print.ascii(newNode)
  if (oldNodeAsText !== newNodeAsText) {
    if (options.onStepCb)
      options.onStepCb({ changeType: ChangeTypes.REARRANGE_COEFF, rootNode: newNode })
    node = newNode
  }
  return node
}

function getNodeFromTopNodeHack(obj, getResultCB) {
  const context = obj.context
  const newNode = obj.newNode?.rootNode || obj.newNode
  const ogRootNode = obj.ogRootNode?.rootNode || obj.ogRootNode
  const ogTopNode = obj.ogTopNode?.rootNode || obj.ogTopNode
  // Convert node back to its root node version. ex. new subnode 5 is placed back into topNode equation as 3 + 2 * 5

  // Change everything to use new updated node
  setUpNewNodeTree(context, newNode)
  // Log the string
  const result = myNodeToString(context.topNode)
  // resultLog.add(result)
  getResultCB(result)

  // Change everything back to the original node.
  // TODO Note. Sometimes the reference may change? Its fixed inside travelTreeExpanded so maybe that's okay?
  setUpNewNodeTree(context, ogRootNode, ogTopNode)
}
function getAllResponsesForRule(fct, root, options) {
  let changeTypeFound = null // i.e. ChangeTypes.SIMPLIFY_ARITHMETIC__ADD || ChangeTypes.SIMPLIFY_ARITHMETIC__MULTIPLY etc.
  const resultLog = new Set()
  const errorResultLog = new Set()
  const ogTopNode = clone(root)

  let isMistakeRuleFound = false

  travelTreeExpanded(root, (_node, context) => {
    const ogRootNode = clone(_node)

    const rulesReses = getRuleResponseForEachUsefulPermutation(fct, _node, {}, null, options)
    if (!rulesReses || rulesReses.length === 0)
      return
    // log the type we found. Its going to be the same for all these nodes.
    changeTypeFound = rulesReses[0].changeType

    isMistakeRuleFound = rulesReses[0].isMistake

    for (const newNode of rulesReses) {
      // places result string in resultLog
      getNodeFromTopNodeHack({ context, newNode, ogTopNode, ogRootNode }, resultStr => resultLog.add(resultStr))
      if (newNode.mistakes) {
        for (const mistakeNode of newNode.mistakes)
          getNodeFromTopNodeHack({ context, newNode: mistakeNode, ogTopNode, ogRootNode }, resultStr => errorResultLog.add({ to: resultStr, changeType: mistakeNode.changeType }))
      }
    }
  })
  if (!changeTypeFound || !resultLog.size === 0)
    return null
  return { changeType: changeTypeFound, to: Array.from(resultLog), isMistake: isMistakeRuleFound, mTo: Array.from(errorResultLog), from: myNodeToString(root), rootNode: root }
}
function getRuleResponseForEachUsefulPermutation(fct, node, simplifyCtxNode = {}, activeNodeOrArgsParent = null, options = null) {
  const rulesReses = []
  const newNode = node.rootNode || node
  // Get all permutations of the node but only the first two nodes. ex. 1 + (2 * 3) + 2 => [1 + (2 * 3) + 2, (2 * 3) + 2 + 1, 2 + 1 + (2 * 3)]
  const perm = getFirstOperationChoicePermutations(newNode, true)
  const seenNodes = new Set()
  for (const _node of perm) {
    const rulesRes = fct(_node, simplifyCtxNode, activeNodeOrArgsParent, options)
    if (rulesRes) {
      const nodeStr = myNodeToString(rulesRes)
      if (!seenNodes.has(nodeStr)) {
        seenNodes.add(nodeStr)
        rulesReses.push(rulesRes)
      }
    }
  }
  return rulesReses
}
export { getAllRuleResponsesForNextStep }
export default {
  getAllRuleResponsesForNextStep,
}
