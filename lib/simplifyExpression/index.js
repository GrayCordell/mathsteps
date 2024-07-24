
const checks      = require('../checks')
const ChangeTypes = require('../ChangeTypes')

const simplifyCommon = require('./_common')
const kemuSortArgs   = require('./kemuSortArgs')

const clone = require('../util/clone')
const print = require('../util/print')

const MAX_STEP_COUNT = 64
const {logTemp} = require('../util/myUtil')


const { commonRules,addRule,defaultCommonPoolOfRules } = require('./rules/commonRules')
const _is = require('mathjs/lib/utils/is')

// const ruleFns = defaultCommonPoolOfRules.map((rule)=>{
//   const obj = {}
//   obj[rule.id] = rule
//   return (node)=> simplifyCommon.applyRules(node,obj)
// })

// Pool of rules to apply.
const poolOfRules = {
  // Convert 3.14 to 314/100 etc. in non-numerical mode.
  convertDecimalToFraction: require('./rules/convertDecimalToFraction'),

  // Apply logarithm rules before arithmetic to avoid huge intermediate
  // values like log10(10^23) => log10(100000000000000000000000)
  // We want log10(10^23) => 23 instead.
  commonFunctionsLogXY: require('./rules/commonFunctionsLogXY'),

  // Basic simplifications that we always try first e.g. (...)^0 => 1
  commonRules: commonRules,

  addRule:addRule,

  // x*a/x gives a
  cancelTerms: require('./rules/cancelTerms'),

  // 3x + 2x gives 5x etc.
  collectLikeTerms: require('./rules/collectLikeTerms'),

  // common function simplification e.g. sin(0) gives 0
  commonFunctions: require('./rules/commonFunctions'),

  // (a + b + c + ...) * x gives ac ax + bx + cx + ... etc.
  distribute: require('./rules/distribute'),

  // sqrt(x^2) gives x or |x| (depends on domain)
  sqrtFromPow: require('./rules/sqrtFromPow'),

  // sqrt(n) - calculate if possible.
  sqrtFromConstant: require('./rules/sqrtFromConstant'),

  // (a + b)^2 gives a^2 + 2ab + b^2 etc.
  multiplyShortFormulas: require('./rules/multiplyShortFormulas'),

  // Numerical result e.g. 1.414 instead of sqrt(2).
  calculateNumericalValue: require('./rules/calculateNumericalValue')

}


function _applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent) {
  let isChanged = false
  let res
  if (simplifyCtx.iterIdx < MAX_STEP_COUNT) {
    // Apply simplify function on current node.
    let   node   = nodeBox[nodeIdx]

    res = fct((node), simplifyCtx, nodeParent)

    const ogIterIdx = nodeBox.iterIdx
    const ogLastChangedNodeBox = nodeBox.lastChangedNodeBox
    const ogLastChangedNodeIdx = nodeBox.lastChangedNodeIdx
    const ogLastChangedNodeParent = nodeBox.lastChangedNodeParent
    const ogRootNode = nodeBox.rootNode
    const ogSimplifyCtxrootNode = simplifyCtx.rootNode
    const ogSimpleCtxIterIdx = simplifyCtx.iterIdx
    const ogSimplifyCtxLastChangedNodeBox = simplifyCtx.lastChangedNodeBox
    const ogSimplifyContextDryRun = simplifyCtx.isDryRun
    const ogOgSimplifyContextRootNode = clone(simplifyCtx.rootNode)
    const ogSimplifyContextRootNode = simplifyCtx.rootNode

    if(res){
      if(simplifyCtx.isWithAlternativeRun){


        const temp1Fn = (res)=>{
          nodeBox[nodeIdx] = res.rootNode || res


          simplifyCtx.isDryRun = true
          const {from,to} = simplifyCtx.onStepCb(res)

          // logTemp(node,res,simplifyCtx, from, to)
          nodeBox.iterIdx = ogIterIdx
          nodeBox.lastChangedNodeBox = ogLastChangedNodeBox
          nodeBox.lastChangedNodeIdx = ogLastChangedNodeIdx
          nodeBox.lastChangedNodeParent = ogLastChangedNodeParent
          nodeBox.rootNode = ogRootNode

          simplifyCtx.isDryRun = ogSimplifyContextDryRun
          simplifyCtx.rootNode = ogSimplifyCtxrootNode
          simplifyCtx.iterIdx = ogSimpleCtxIterIdx
          simplifyCtx.lastChangedNodeBox = ogSimplifyCtxLastChangedNodeBox
          simplifyCtx.rootNode = ogSimplifyContextRootNode
          return {from,to}
        }
        if(res.rootNodeAlts){
          for(const alt of res.rootNodeAlts){
            const newRes = {
              changeType:res.changeType,rootNode:alt
            }
            const {to,from} = temp1Fn(newRes)
            simplifyCtx.resToFromJsonLog = JSON.stringify({from:from.toString(), to:to.toString(), ogChangeType:res.changeType})
            console.log(`change:${res.changeType}\nog:${from.toString()}\nnew:${to.toString()}`)
          }
          simplifyCtx.rootNode = ogOgSimplifyContextRootNode
          console.log('__next__')
        }

      }
      if(!simplifyCtx.isDryRun){
        isChanged        = true
        nodeBox[nodeIdx] = res.rootNode
        // Track last changed node.
        // We'll start next simplify step from this node.
        simplifyCtx.lastChangedNodeBox    = nodeBox
        simplifyCtx.lastChangedNodeIdx    = nodeIdx
        simplifyCtx.lastChangedNodeParent = nodeParent
        simplifyCtx.onStepCb(res)
      }
    } else if (node.args) {
      // Nothing changed on current node.
      // Go into child nodes recursively.
      for (let argIdx in node.args) {
        isChanged |= _applyRulesOnChildNode(fct, node.args, argIdx, simplifyCtx, node).isChanged
      }
    }
  }
  if(res && simplifyCtx.isDryRun ){
    return {
      isChanged:false,
      res:null
    }
  }

  return { isChanged, res }
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
      isDryRun: options.isDryRun,
      isWithAlternativeRun: options.isWithAlternativeRun,
      resToFromJsonLog:[],

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
          logSteps(stepMeta, node, simplifyCtx.expressionCtx, simplifyCtx.rootNode)
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

        if(!simplifyCtx.isDryRun){
          stepMeta.rootNode = clone(simplifyCtx.rootNode)
          oldNode = stepMeta.rootNode
        }

        if (options.onStepCb) {
          const newMeta = stepMeta
          newMeta.resToFromJsonLog = simplifyCtx.resToFromJsonLog
          options.onStepCb(newMeta)
        }
        // my quick fix. Not sure what why thats happening. Think it has to do with parenthesis.
        if(simplifyCtx.rootNode.implicit && _is.isConstantNode(simplifyCtx.rootNode.args[0]) && _is.isConstantNode(simplifyCtx.rootNode.args[1])){
          simplifyCtx.rootNode.implicit = false
        }
        if(oldNode && simplifyCtx.rootNode)
          return {
            from: oldNode.toString(),
            to: simplifyCtx.rootNode.toString()
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
      for (const [ruleId, fct] of Object.entries(poolOfRules)) {
        {
          if(options[`disable${ruleId}`]) {
            continue
          }
          const temp = _applyRulesOnChildNode(fct, nodeBox, nodeIdx, simplifyCtx, nodeParent)
          if (temp.isChanged) {
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
}

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
