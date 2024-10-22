/* eslint-disable no-throw-literal */
import clone from '~/newServices/nodeServices/clone.js'
import { parseText } from '~/newServices/nodeServices/parseText'
import checks from '../checks/index.js'
import { ChangeTypes } from '../types/changeType/ChangeTypes'
import { printAscii } from '../util/print.js'
import { getAllRuleResponsesForNextStep } from './getAllRuleResponsesForNextStep.js'
import { kemuFlatten, kemuNormalizeConstantNodes } from './kemuSimplifyCommonServices.js'
import kemuSortArgs from './kemuSortArgs.js'
import { POOLED_TOGETHER_POOL_OF_RULES } from './theIndexRulePool'

const MAX_STEP_COUNT = 64
function _applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent) {
  let isChanged = false
  if (simplifyCtx.iterIdx < MAX_STEP_COUNT) {
    // Apply simplify function on current node.
    const node = nodeBox[nodeIdx]
    const status = fct(node, simplifyCtx, nodeParent)
    if (status) {
      // Current node changed.
      // Report simplify step.
      isChanged = true
      nodeBox[nodeIdx] = status.rootNode
      // Track last changed node.
      // We'll start next simplify step from this node.
      simplifyCtx.lastChangedNodeBox = nodeBox
      simplifyCtx.lastChangedNodeIdx = nodeIdx
      simplifyCtx.lastChangedNodeParent = nodeParent
      simplifyCtx.onStepCb(status)
    }
    else if (node.args) {
      // Nothing changed on current node.
      // Go into child nodes recursively.
      for (const argIdx in node.args)
        isChanged |= _applyRulesOnChildNode(fct, node.args, argIdx, simplifyCtx, node)
    }
  }
  return isChanged
}
function _replaceChildNodeAfterClone(originalRoot, clonedRoot, nodeToBeReplaced, nodeToPut) {
  let rv = clonedRoot
  // eslint-disable-next-line eqeqeq
  if (originalRoot == nodeToBeReplaced) {
    rv = nodeToPut
  }
  else if (originalRoot.args) {
    for (const idx in originalRoot.args)
      clonedRoot.args[idx] = _replaceChildNodeAfterClone(originalRoot.args[idx], clonedRoot.args[idx], nodeToBeReplaced, nodeToPut)
  }
  return rv
}
// Given a mathjs expression node, steps through simplifying the expression.
// Returns a list of details about each step.
function stepThrough(node, options = {}) {
  if (options.isDebugMode)
    console.log(`\n\nSimplifying: ${printAscii(node)}`)

  //
  // Pre-process node.
  //
  node = kemuFlatten(node)
  // Add hard-coded first step with original expression.
  if (options.onStepCb) {
    options.onStepCb({
      changeType: ChangeTypes.KEMU_ORIGINAL_EXPRESSION,
      rootNode: clone(node),
    })
  }
  if (!checks.hasUnsupportedNodes(node)) {
    //
    // Set-up simplify context passed along all steps.
    //
    const simplifyCtx = {
      iterIdx: 0,
      rootNode: node,
      expressionCtx: options.expressionCtx,
      // Callback called when any part of expression (node) changed.
      // We use it to track/collect steps.
      onStepCb: (stepMeta) => {
        // Validate step fields.
        if (!stepMeta.changeType)
          throw 'missing change type'

        if (!stepMeta.rootNode)
          throw 'missing root node'

        if (options.isDebugMode)
          logSteps(stepMeta)

        simplifyCtx.rootNode = kemuFlatten(simplifyCtx.rootNode)
        simplifyCtx.rootNode = kemuNormalizeConstantNodes(simplifyCtx.rootNode)
        simplifyCtx.iterIdx++
        // Possible improvement: Optimize it.
        if (stepMeta.altForms) {
          stepMeta.altForms.forEach((oneAltForm) => {
            // eslint-disable-next-line no-use-before-define
            const altFormNodeRoot = clone(oldNode)
            const nodeToBeReplaced = simplifyCtx.lastChangedNodeBox[simplifyCtx.lastChangedNodeIdx]
            const nodeToPut = oneAltForm.node
            // Build whole altForm node by clonning root and replace changed
            // node only.
            oneAltForm.node = _replaceChildNodeAfterClone(simplifyCtx.rootNode, altFormNodeRoot, nodeToBeReplaced, nodeToPut)
          })
        }
        stepMeta.rootNode = clone(simplifyCtx.rootNode)

        // eslint-disable-next-line no-use-before-define
        oldNode = stepMeta.rootNode
        if (options.onStepCb)
          options.onStepCb(stepMeta)
      },
    }
    //
    // Apply simplify rules to the expression.
    //
    const originalNode = clone(node)
    let oldNode = originalNode
    let goOn = true
    let isShuffled = false
    let expressionAsTextAfterShuffle = null
    // Step through the math expression until nothing changes.
    while (goOn) {
      goOn = false
      // Process last changed node or root.
      const nodeBox = simplifyCtx.lastChangedNodeBox || simplifyCtx
      const nodeIdx = simplifyCtx.lastChangedNodeIdx || 'rootNode'
      const nodeParent = simplifyCtx.lastChangedNodeParent
      // Apply common rules first.
      for (const ruleIdx in POOLED_TOGETHER_POOL_OF_RULES) {
        if (options[`disable${ruleIdx}`])
          continue
        const fct = POOLED_TOGETHER_POOL_OF_RULES[ruleIdx]
        if (_applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent)) {
          goOn = true
          isShuffled = false
          break
        }
      }
      // Back to root if child node went to dead-end.
      if (!goOn && simplifyCtx.lastChangedNodeBox) {
        // Reset current node to the root.
        goOn = true
        simplifyCtx.lastChangedNodeBox = null
        simplifyCtx.lastChangedNodeIdx = null
        simplifyCtx.lastChangedNodeParent = null
      }
      // Try refactor whole expression from scratch if still dead-end.
      if (!goOn && !isShuffled) {
        const exprAsText = printAscii(simplifyCtx.rootNode)
        if (expressionAsTextAfterShuffle !== exprAsText) {
          // Try shuffle only once after each dead-end.
          isShuffled = true
          goOn = true
          // Reset current node to the root.
          simplifyCtx.lastChangedNodeBox = null
          simplifyCtx.lastChangedNodeIdx = null
          simplifyCtx.lastChangedNodeParent = null
          simplifyCtx.rootNode = parseText(exprAsText)
          expressionAsTextAfterShuffle = exprAsText
        }
      }
      // Limit iterations to avoid potentially hung-up.
      if (simplifyCtx.iterIdx === MAX_STEP_COUNT) {
        console.error(`Math error: Potential infinite loop for expression: ${printAscii(originalNode)}`)
        goOn = false
      }
    }
    //
    // Post-process node.
    //
    node = oldNode
    // Possible improvement: Optimize it.
    const newNode = kemuSortArgs(clone(oldNode))
    const oldNodeAsText = printAscii(oldNode)
    const newNodeAsText = printAscii(newNode)
    if (oldNodeAsText !== newNodeAsText) {
      if (options.onStepCb) {
        options.onStepCb({
          changeType: ChangeTypes.REARRANGE_COEFF,
          rootNode: newNode,
        })
      }
      node = newNode
    }
  }
  return node
}
function logSteps(nodeStatus) {
  console.log(nodeStatus.changeType)
  console.log(printAscii(nodeStatus.rootNode))
  if (nodeStatus.substeps.length > 0) {
    console.log('substeps: ')
    nodeStatus.substeps.forEach((substep, idx) => {
      console.log('...', idx, '|', printAscii(substep.rootNode))
    })
  }
}
export const oldApi = function (node, options = {}) {
  const steps = []
  stepThrough(node, {
    isDebugMode: options.isDebugMode,
    expressionCtx: options.expressionCtx,
    onStepCb: (oneStep) => {
      steps.push(oneStep)
    },
  })
  return steps
}
export const newApi = function (node, options = {}) {
  if (options.getAllNextStepPossibilities)
    return getAllRuleResponsesForNextStep(node, options)
  else
    return stepThrough(node, options)
}
export default {
  oldApi,
  newApi,
}
