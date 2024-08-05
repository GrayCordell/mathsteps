const EqualityCache = require('./equalityCache')
const {myToString} = require('./myUtil')
const kemuSortArgs = require('../simplifyExpression/kemuSortArgs')
const clone = require('./clone')
const {parseText} = require('../../index')
const {travelTree} = require('./treeUtil')

const equalsCache =  new EqualityCache(expressionEqualsCore)
function myMoreNormalization(node){
  travelTree(node,(_node)=>{
        // remove implicit multiplication.
    if(_node.implicit)
      _node.implicit = false

        // remove multiply by 1
    if(node.type === 'OperatorNode' && node.fn === 'multiply'){
      node.args = node.args.filter((arg)=>arg.toString() !== '1')
      if(node.args.length === 1)
        node = node.args[0]
    }
  })
  return node
}

function expressionEquals(exp0, exp1){
  return equalsCache.areEqual(exp0,exp1)
}
function expressionEqualsCore(exp0, exp1){
  if(typeof exp0 === 'string' && myToString(exp0) === myToString(exp1)) // naive string check
    return true
  if(!exp0 || !exp1) // fail
    return false

  let newexp0 = typeof exp0 !== 'string'
      ? myMoreNormalization(kemuSortArgs(clone((exp0)),true))
      : myMoreNormalization(kemuSortArgs(parseText(exp0),true))

  let newexp1 = typeof exp1 !== 'string'
      ? myMoreNormalization(kemuSortArgs((clone(exp1)),true))
      : myMoreNormalization(kemuSortArgs((parseText(exp1)),true))

  return newexp0.equals(newexp1) || myToString(newexp0) === myToString(newexp1)
}

module.exports = {
  expressionEquals,
  expressionEqualsCore,
  myMoreNormalization,
  equalsCache,
}
