const checks      = require('../checks')
const ChangeTypes = require('../ChangeTypes')

const simplifyCommon = require('./_common')
const kemuSortArgs   = require('./kemuSortArgs')

const clone = require('../util/clone')
const print = require('../util/print')
const {getAllRuleResponsesForNextStep} = require('./getAllRuleResponsesForNextStep')
const {POOLED_TOGETHER_POOL_OF_RULES} = require('./theIndexRulePool')

const MAX_STEP_COUNT = 64
function _applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent) {
  let isChanged = false

  if (simplifyCtx.iterIdx < MAX_STEP_COUNT) {
    // Apply simplify function on current node.
    let   node   = nodeBox[nodeIdx]
    const status = fct(node, simplifyCtx, nodeParent)

    if (status) {
      // Current node changed.
      // Report simplify step.
      isChanged        = true
      nodeBox[nodeIdx] = status.rootNode

      // Track last changed node.
      // We'll start next simplify step from this node.
      simplifyCtx.lastChangedNodeBox    = nodeBox
      simplifyCtx.lastChangedNodeIdx    = nodeIdx
      simplifyCtx.lastChangedNodeParent = nodeParent
      simplifyCtx.onStepCb(status)

    } else if (node.args) {
      // Nothing changed on current node.
      // Go into child nodes recursively.
      for (let argIdx in node.args) {
        isChanged |= _applyRulesOnChildNode(fct, node.args, argIdx, simplifyCtx, node)
      }
    }
  }

  return isChanged
}

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

// Given a mathjs expression node, steps through simplifying the expression.
// Returns a list of details about each step.
function stepThrough(node, options = {}) {
  if (options.isDebugMode) {
    // eslint-disable-next-line
    console.log('\n\nSimplifying: ' + print.ascii(node));
  }

  //
  // Pre-process node.
  //

  node = simplifyCommon.kemuFlatten(node)

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
        if (!stepMeta.changeType) {
          throw 'missing change type'
        }
        if (!stepMeta.rootNode) {
          throw 'missing root node'
        }

        if (options.isDebugMode) {
          logSteps(stepMeta)
        }

        simplifyCtx.rootNode = simplifyCommon.kemuFlatten(simplifyCtx.rootNode)
        simplifyCtx.rootNode = simplifyCommon.kemuNormalizeConstantNodes(simplifyCtx.rootNode)
        simplifyCtx.iterIdx++

        // Possible improvement: Optimize it.
        if (stepMeta.altForms) {
          stepMeta.altForms.forEach((oneAltForm) => {
            const altFormNodeRoot  = clone(oldNode)
            const nodeToBeReplaced = simplifyCtx.lastChangedNodeBox[simplifyCtx.lastChangedNodeIdx]
            const nodeToPut        = oneAltForm.node

            // Build whole altForm node by clonning root and replace changed
            // node only.
            oneAltForm.node = _replaceChildNodeAfterClone(
                simplifyCtx.rootNode,
                altFormNodeRoot,
                nodeToBeReplaced,
                nodeToPut
            )
          })
        }

        stepMeta.rootNode = clone(simplifyCtx.rootNode)
        oldNode = stepMeta.rootNode

        if (options.onStepCb) {
          options.onStepCb(stepMeta)
        }
      }
    }

    //
    // Apply simplify rules to the expression.
    //

    const originalNode = clone(node)
    let   oldNode      = originalNode
    let   goOn         = true

    let isShuffled = false
    let expressionAsTextAfterShuffle = null

    // Step through the math expression until nothing changes.
    while (goOn) {
      goOn = false

      // Process last changed node or root.
      const nodeBox    = simplifyCtx.lastChangedNodeBox || simplifyCtx
      const nodeIdx    = simplifyCtx.lastChangedNodeIdx || 'rootNode'
      const nodeParent = simplifyCtx.lastChangedNodeParent

      // Apply common rules first.
      for (let ruleIdx in POOLED_TOGETHER_POOL_OF_RULES) {
        if(options[`disable${ruleIdx}`])
          continue

        const fct = POOLED_TOGETHER_POOL_OF_RULES[ruleIdx]
        if (_applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent)) {
          goOn       = true
          isShuffled = false
          break
        }
      }

      // Back to root if child node went to dead-end.
      if (!goOn && simplifyCtx.lastChangedNodeBox) {
        // Reset current node to the root.
        goOn = true
        simplifyCtx.lastChangedNodeBox    = null
        simplifyCtx.lastChangedNodeIdx    = null
        simplifyCtx.lastChangedNodeParent = null
      }

      // Try refactor whole expression from scratch if still dead-end.
      if (!goOn && !isShuffled) {
        // Rebuild expression from the scratch.
        const mathsteps  = require('../../index.js')
        const exprAsText = print.ascii(simplifyCtx.rootNode)

        if (expressionAsTextAfterShuffle !== exprAsText) {
          // Try shuffle only once after each dead-end.
          isShuffled = true
          goOn       = true

          // Reset current node to the root.
          simplifyCtx.lastChangedNodeBox    = null
          simplifyCtx.lastChangedNodeIdx    = null
          simplifyCtx.lastChangedNodeParent = null
          simplifyCtx.rootNode              = mathsteps.parseText(exprAsText)

          expressionAsTextAfterShuffle = exprAsText
        }
      }

      // Limit iterations to avoid potentially hung-up.
      if (simplifyCtx.iterIdx === MAX_STEP_COUNT) {
        // eslint-disable-next-line
        console.error('Math error: Potential infinite loop for expression: ' + print.ascii(originalNode))
        goOn = false
      }
    }

    //
    // Post-process node.
    //

    node = oldNode

    // Possible improvement: Optimize it.
    const newNode       = kemuSortArgs(clone(oldNode))
    const oldNodeAsText = print.ascii(oldNode)
    const newNodeAsText = print.ascii(newNode)

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
  // eslint-disable-next-line
  console.log(nodeStatus.changeType);
  // eslint-disable-next-line
  console.log(print.ascii(nodeStatus.rootNode));

  if (nodeStatus.substeps.length > 0) {
    // eslint-disable-next-line
    console.log('substeps: ');
    nodeStatus.substeps.forEach((substep, idx) => {
      console.log('...', idx, '|', print.ascii(substep.rootNode))
    })
  }
}

module.exports = {
  oldApi: function (node, options = {}) {
    const steps = []

    stepThrough(node, {
      isDebugMode: options.isDebugMode,
      expressionCtx: options.expressionCtx,
      onStepCb: (oneStep) => {
        steps.push(oneStep)
      }
    })

    return steps
  },

  newApi: function (node, options = {}) {
    if(options.getAllNextStepPossibilities)
      return getAllRuleResponsesForNextStep(node, options)
    else
      return stepThrough(node, options)
  }
}
