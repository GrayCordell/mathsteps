const simplifyCommon = require('./_common')
const ChangeTypes = require('../ChangeTypes')
const clone = require('../util/clone')
const checks = require('../checks')
const print = require('../util/print')
const kemuSortArgs = require('./kemuSortArgs')
const {POOL_OF_RULES} = require('./theIndexRulePool')
const {travelTreeExpanded} = require('../util/treeUtil')
const {setUpNewNodeTree} = require('../util/treeUtil')
const {getFirstOperationChoicePermutations} = require('../util/nodePermutations')
const {myToString} = require('../util/myUtil')


function getAllRuleResponsesForNextStep(node, options = {}) {
    // Pre-process node.
  node = simplifyCommon.kemuFlatten(node)

    // Add hard-coded first step with original expression.
  if (options.onStepCb)
    options.onStepCb({ changeType: ChangeTypes.KEMU_ORIGINAL_EXPRESSION, rootNode: clone(node)})

  const isAllowed = !checks.hasUnsupportedNodes(node)
  if(!isAllowed)
    return

    // Apply simplify rules to the expression.
  const originalNode = clone(node)
  let   oldNode0      = originalNode

  const root    = node
  const nodeIdx    = 'rootNode'

  // Apply common rules first.
  for (const [ruleId, fct] of Object.entries(POOL_OF_RULES)) {
    if(options[`disable${ruleId}`])
      continue
    const res = getAllResponsesForRule(fct,root,nodeIdx)
    if(res)
      options.onStepCb(res)

  }

  //
  // Post-process node.
  //
  node = oldNode0
  // Possible improvement: Optimize it.
  const newNode       = kemuSortArgs(clone(oldNode0))
  const oldNodeAsText = print.ascii(oldNode0)
  const newNodeAsText = print.ascii(newNode)
  if (oldNodeAsText !==  newNodeAsText) {
    if (options.onStepCb)
      options.onStepCb({ changeType: ChangeTypes.REARRANGE_COEFF, rootNode: newNode})
    node = newNode
  }

  return node
}

function getAllResponsesForRule(fct, root) {
  let changeTypeFound = null // i.e. ChangeTypes.SIMPLIFY_ARITHMETIC__ADD || ChangeTypes.SIMPLIFY_ARITHMETIC__MULTIPLY etc.
  const resultLog = new Set()

  const ogTopNode = clone(root)
  travelTreeExpanded(root, (_node, context) => {
    const ogRootNode = clone(_node)
    const rulesReses = getRuleResponseForEachUsefulPermutation(fct, _node)
    if (!rulesReses || rulesReses.length === 0)
      return

    // Get the first node and attach all the other nodes as alternatives.
    const ruleRes = rulesReses[0]
    ruleRes.rootNodeAlts = rulesReses.map(res => res.rootNode)
    // log the type we found. Its going to be the same for all these nodes.
    changeTypeFound = ruleRes.changeType

    for (const newNode of ruleRes.rootNodeAlts) {
      //
      // Convert node back to its root node version. ex. new subnode 5 is placed back into topNode equation as 3 + 2 * 3
      //
      // Change everything to use new updated node
      setUpNewNodeTree(context, newNode)

      // Log the string
      const result = context.topNode.value && !context.topNode.args
          ? context.topNode.value.toString()
          : context.topNode.toString()
      resultLog.add(result)

      // Change everything back to the original node.
      // TODO Note. Sometimes the reference may change? Its fixed inside travelTreeExpanded so maybe that's okay?
      setUpNewNodeTree(context, ogRootNode, ogTopNode)
    }
  })

  const resultLogArray = Array.from(resultLog)

  if (!changeTypeFound || !resultLogArray.length)
    return null
  return { changeType: changeTypeFound, to: resultLogArray, from: root.toString(), rootNode: root }
}

function getRuleResponseForEachUsefulPermutation(fct, node, simplifyCtxNode = {}, activeNodeOrArgsParent = null) {
  const rulesReses = []
  const newNode = node.rootNode || node
  // Get all permutations of the node but only the first two nodes. ex. 1 + (2 * 3) + 2 => [1 + (2 * 3) + 2, (2 * 3) + 2 + 1, 2 + 1 + (2 * 3)]
  const perm = getFirstOperationChoicePermutations(newNode, true)
  const seenNodes = new Set()

  for (const _node of perm) {
    const rulesRes = fct(_node, simplifyCtxNode, activeNodeOrArgsParent)
    if (rulesRes) {
      const nodeStr = myToString(rulesRes)
      if (!seenNodes.has(nodeStr)) {
        seenNodes.add(nodeStr)
        rulesReses.push(rulesRes)
      }
    }
  }

  return rulesReses
}

module.exports = {
  getAllRuleResponsesForNextStep,
}
