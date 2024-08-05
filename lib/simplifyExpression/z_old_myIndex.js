/*
const simplifyCommon = require('./_common')
const ChangeTypes = require('../ChangeTypes')
const clone = require('../util/clone')
const checks = require('../checks')
const _is = require('mathjs/lib/utils/is')
const print = require('../util/print')
const mathsteps = require('../../index')
const kemuSortArgs = require('./kemuSortArgs')
const {logSteps} = require('./myIndexHelpers')
const {poolOfRules} = require('./myIndexRulePool')
const {fullNormalizeNode} = require('./myIndexHelpers')
const {handleAltFormProcedure} = require('./myIndexHelpers')
const {resetCurrentNodeToRoot} = require('./myIndexHelpers')
const {shallowRefCopyNodeCTX} = require('./myIndexHelpers')
const {setNodeBackToOgCtx} = require('./myIndexHelpers')


const MAX_STEP_COUNT = 64
function stepThrough(node, options = {}) {
  // Pre-process node.
  node = simplifyCommon.kemuFlatten(node)

  // Add hard-coded first step with original expression.
  if (options.onStepCb)
    options.onStepCb({ changeType: ChangeTypes.KEMU_ORIGINAL_EXPRESSION, rootNode: clone(node)})

  const isAllowed = !checks.hasUnsupportedNodes(node)
  if(!isAllowed)
    return

  // Set-up simplify context passed along all steps.
  const simplifyCtxNode = {
    iterIdx: 0,
    rootNode: node,
    expressionCtx: options.expressionCtx,
    isDryRun: options.isDryRun,
    isWithAlternativeRun: options.isWithAlternativeRun,

      // Callback called when any part of expression (node) changed.
      // We use it to track/collect steps.
    onStepCb: (stepMeta) => {
      if (!stepMeta.changeType || !stepMeta.rootNode)
        throw 'missing change type or root node'
      if (options.isDebugMode)
        logSteps(stepMeta, node, simplifyCtxNode.expressionCtx, simplifyCtxNode.rootNode)

      fullNormalizeNode(stepMeta)
        // Next step
      simplifyCtxNode.iterIdx++

        // Possible improvement: Optimize it.
      if (stepMeta.altForms)
        handleAltFormProcedure(stepMeta,node,simplifyCtxNode)

        // don't change the original node if we're doing a dry run
      if(!simplifyCtxNode.isDryRun){
        stepMeta.rootNode = clone(simplifyCtxNode.rootNode)
        oldNode0 = stepMeta.rootNode
      }

        // Call user callback.
      if (options.onStepCb) {
          // temp fix
        const newMeta = stepMeta
        newMeta.resToFromJsonLog = simplifyCtxNode.resToFromJsonLog
        options.onStepCb(newMeta)
      }
        // my quick fix. Not sure what why thats happening. Think it has to do with parenthesis. Implicit=false puts * back in
      if(simplifyCtxNode.rootNode.implicit && _is.isConstantNode(simplifyCtxNode.rootNode.args[0]) && _is.isConstantNode(simplifyCtxNode.rootNode.args[1])){
        simplifyCtxNode.rootNode.implicit = false
      }
        // Added for just getting back a result. Was not used before. Not normally important.
      if(oldNode0 && simplifyCtxNode.rootNode)
        return {
          from: oldNode0.toString(),
          to: simplifyCtxNode.rootNode.toString()
        }
    }
  }

  // Apply simplify rules to the expression.
  const originalNode = clone(node)
  let   oldNode0      = originalNode
  let   continueOnToNext         = true

  let isShuffled = false

  let lastExpressionAsTextAfterAShuffleOccurred = null

  // Step through the math expression until nothing changes.
  while (continueOnToNext) {
    continueOnToNext = false

      // Process last changed node or root.
    const activeNode    = simplifyCtxNode.lastChangedActiveNode || simplifyCtxNode
    const nodeIdx    = simplifyCtxNode.lastChangedActiveNodeIdx || 'rootNode'
    const activeNodeParent = simplifyCtxNode.lastChangedActiveNodeParent || null


    // Apply common rules first.
    for (const [ruleId, fct] of Object.entries(poolOfRules)) {
      if(options[`disable${ruleId}`])
        continue
      const tempRes = _applyRulesOnChildNode(fct,activeNode,nodeIdx,simplifyCtxNode,activeNodeParent)
      if(tempRes.isChanged){
        continueOnToNext = true
        isShuffled = false
        break
      }
      const isAChildAndADeadEnd = !continueOnToNext && simplifyCtxNode.lastChangedActiveNode
      if (isAChildAndADeadEnd) {
        // set it back to the original node (rootNode)
        resetCurrentNodeToRoot(simplifyCtxNode)
        continueOnToNext = true
      }

      // !Not sure why its called shuffle. It doesn't seem to shuffle the expression?
      // Try refactor whole expression from scratch if still dead-end.
      const hasFoundNothingAndHasYetToTryAShuffle = !continueOnToNext && !isShuffled
      if (hasFoundNothingAndHasYetToTryAShuffle) {
        // Rebuild expression from the scratch.
        const exprAsText = print.ascii(simplifyCtxNode.rootNode)

        if (lastExpressionAsTextAfterAShuffleOccurred !== exprAsText) {
          // Try shuffle only once after each dead-end.
          isShuffled = true
          continueOnToNext       = true

          // Reset current node to the root.
          resetCurrentNodeToRoot(simplifyCtxNode)
          simplifyCtxNode.rootNode              = mathsteps.parseText(exprAsText)

          lastExpressionAsTextAfterAShuffleOccurred = exprAsText
        }
      }

      // Limit iterations to avoid potentially hung-up.
      if (simplifyCtxNode.iterIdx === MAX_STEP_COUNT) {
          // eslint-disable-next-line
          console.error('Math error: Potential infinite loop for expression: ' + print.ascii(originalNode))
        continueOnToNext = false
      }
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
  }

  return node
}


function _applyRulesOnChildNode(fct, activeNode, nodeIdx, simplifyCtxNode, activeNodeParent) {
  let isChanged = false
  let ruleRes = null
  if (simplifyCtxNode.iterIdx < MAX_STEP_COUNT) {
        // Apply simplify function on current node.
    let   node   = activeNode[nodeIdx] // ? Is this not just always root?

    ruleRes = fct((node), simplifyCtxNode, activeNodeParent)

    const ogActiveNode = shallowRefCopyNodeCTX(activeNode)
    const ogSimplifyCtxNode = shallowRefCopyNodeCTX(simplifyCtxNode)

    if(ruleRes){
      if(simplifyCtxNode.isWithAlternativeRun){
        const getFromToFromRuleResultFn = (_ruleRes)=>{
          activeNode[nodeIdx] = _ruleRes.rootNode || _ruleRes
          simplifyCtxNode.isDryRun = true
          const {from,to} = simplifyCtxNode.onStepCb(_ruleRes)
          setNodeBackToOgCtx(activeNode,ogActiveNode)
          setNodeBackToOgCtx(simplifyCtxNode,ogSimplifyCtxNode)
          return {from,to}
        }
        if(ruleRes.rootNodeAlts){
          for(const alt of ruleRes.rootNodeAlts){
            const {to,from} = getFromToFromRuleResultFn({ changeType:ruleRes.changeType, rootNode:alt})
            simplifyCtxNode.resToFromJsonLog = JSON.stringify({from:from.toString(), to:to.toString(), ogChangeType:ruleRes.changeType})
            console.log(`change:${ruleRes.changeType}\nog:${from.toString()}\nnew:${to.toString()}`)
          }
          simplifyCtxNode.rootNode = ogSimplifyCtxNode.ogRootNode
          console.log('__next__')
        }
      }
      if(!simplifyCtxNode.isDryRun){
        isChanged        = true
        activeNode[nodeIdx] = ruleRes.rootNode
        // Track last changed node.
        // We'll start next simplify step from this node.
        simplifyCtxNode.lastChangedActiveNode    = activeNode
        simplifyCtxNode.lastChangedActiveNodeIdx    = nodeIdx
        simplifyCtxNode.lastChangedActiveNodeParent = activeNodeParent
        simplifyCtxNode.onStepCb(ruleRes)
      }
    } else if (node.args) {
      // Nothing changed on current node.
      // Go into child nodes recursively.
      for (let argIdx in node.args) {
        isChanged |= _applyRulesOnChildNode(fct, node.args, argIdx, simplifyCtxNode, node).isChanged
      }
    }
  }

  if(ruleRes && simplifyCtxNode.isDryRun )
    return { isChanged:false, res:null }

  return { isChanged, res:ruleRes }
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
    return stepThrough(node, options)
  }
}
*/
