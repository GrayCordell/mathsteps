/* eslint-disable no-throw-literal */
import { math } from '~/config'
import ChangeTypes from './types/ChangeTypes'
import Node from './node/index.js'
import stepThrough from './simplifyExpression/index.js'
import { ascii, latex } from './util/print.js'
import clone from '~/newServices/nodeServices/clone.js'
import Equation from './kemuEquation/Equation.js'
import EquationSolver from './kemuEquation/EquationSolverCore.js'
import { kemuNormalizeConstantNodes } from './simplifyExpression/kemuSimplifyCommonServices.js'

const print = { ascii }.ascii
const printLatex = { latex }.latex
const CACHE_ENABLED = true
const CACHE_LOG_MISSING_ENABLED = false
const CACHE_LOG_REUSED_ENABLED = false
const CACHE_COMPARE = {}
const CACHE_TEXT_TO_TEX = {}
const CACHE_TEXT_TO_NODE = {}
// Stack of caller registered preprocess function.
// Empty by default.

const ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE = []
const ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE = []
function _compareByTextInternal(x, y) {
  try {
    return math.compare(x, y)
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err) {
    return Number.NaN
  }
}
function _postProcessResultTeX(resultTeX) {
  // Don't use x := y definitions.
  // We want x = y everywhere.
  return resultTeX.replace(':=', '=')
}
function printAsTeX(node) {
  return _postProcessResultTeX(printLatex(node))
}
function compareByText(x, y) {
  let rv = Number.NaN
  if (CACHE_ENABLED) {
    const cacheKey = `${x}|${y}`
    rv = CACHE_COMPARE[cacheKey]
    if (rv == null) {
      // Cache missing.
      if (CACHE_LOG_MISSING_ENABLED)
        console.log('[ KMATHSTEPS ] Cache missing (compare)', x, y)

      rv = _compareByTextInternal(x, y)
      CACHE_COMPARE[cacheKey] = rv
    }
    else {
      // Already cached - reuse previous result.
      if (CACHE_LOG_REUSED_ENABLED)
        console.log('[ KMATHSTEPS ] Cache reused (compare)', x, y)
    }
  }
  else {
    // Cache disabled - just wrap original call.
    rv = _compareByTextInternal(x, y)
  }
  return rv
}
function _convertTextToTeXInternal(text) {
  // Handle equation render: a = b = c = ...
  let rv = ''
  const tokens = text.split('=')
  let sep = ''
  tokens.forEach((token) => {
    token = token.trim()
    if (token !== '') {
      rv += sep + printAsTeX(parseText(token))
      sep = '='
    }
  })
  return rv
}
function convertTextToTeX(text) {
  let rv = text
  if (text && (text.trim() !== '')) {
    if (CACHE_ENABLED) {
      text = text.trim()
      rv = CACHE_TEXT_TO_TEX[text]
      if (rv == null) {
        // Cache missing.
        if (CACHE_LOG_MISSING_ENABLED)
          console.log('[ KMATHSTEPS ] Cache missing (text to TeX)', text)

        rv = _convertTextToTeXInternal(text)
        CACHE_TEXT_TO_TEX[text] = rv
      }
      else {
        // Already cached - reuse previous result.
        if (CACHE_LOG_REUSED_ENABLED)
          console.log('[ KMATHSTEPS ] Cache reused (text to TeX)', text)
      }
    }
    else {
      // Cache disabled - just wrap original call.
      rv = _convertTextToTeXInternal(text)
    }
  }
  return rv
}

function _kemuNormalizeMultiplyDivision(node) {
  if (node.op === '/') {
    // x/y
    const nodeTop = node.args[0]
    const nodeBottom = node.args[1]
    if ((nodeTop.op === '*')
      && (nodeTop.args[0].op === '/')) {
      // a/b * c         a   c
      // -------- gives  - * -
      //  d              b   d
      const nodeCd = node
      node = node.args[0]
      nodeCd.args = [nodeTop.args[1], nodeBottom]
      node.args[1] = nodeCd
    }
  }
  if (node.args) {
    node.args.forEach((oneArg, idx) => {
      if (oneArg)
        node.args[idx] = _kemuNormalizeMultiplyDivision(oneArg)
    })
  }
  return node
}
function _parseTextInternal(text) {
  // Preprocess text before passing in to mathjs parser if needed.
  ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE.forEach((preprocessFct) => {
    text = preprocessFct(text)
  })
  // Process text into node.
  let rv = math.parse(text)
  // Make sure we store all constant nodes as bignumber to avoid fake unequals.
  rv = kemuNormalizeConstantNodes(rv)
  rv = _kemuNormalizeMultiplyDivision(rv)
  // Preprocess just generated node tree if needed.
  ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE.forEach((preprocessFct) => {
    rv = preprocessFct(rv)
  })
  return rv
}
function parseText(text) {
  let rv = null
  if (CACHE_ENABLED) {
    text = text.trim()
    rv = CACHE_TEXT_TO_NODE[text]
    if (rv == null) {
      // Cache missing.
      if (CACHE_LOG_MISSING_ENABLED)
        console.log('[ KMATHSTEPS ] Cache missing (text to node)', text)

      rv = _parseTextInternal(text)
      CACHE_TEXT_TO_NODE[text] = rv
    }
    else {
      // Already cached - reuse previous result.
      if (CACHE_LOG_REUSED_ENABLED)
        console.log('[ KMATHSTEPS ] Cache reused (text to node)', text)
    }
    // Avoid modifying nodes stored inside cache.
    rv = clone(rv)
  }
  else {
    // Cache disabled - just wrap original call.
    rv = _parseTextInternal(text)
  }
  return rv
}
function simplifyExpression(optionsOrExpressionAsText) {
  let rv = null
  // eslint-disable-next-line no-useless-catch
  try {
    // Fetch input expression.
    let expressionNode = null
    let options = {}
    if (typeof optionsOrExpressionAsText === 'string') {
      expressionNode = parseText(optionsOrExpressionAsText)
    }
    else {
      options = optionsOrExpressionAsText
      if (options.expressionAsText != null)
        expressionNode = parseText(options.expressionAsText)

      else if (options.expressionNode != null)
        expressionNode = options.expressionNode
    }
    if (expressionNode == null)
      throw 'missing expression'

    // Simplify expression.
    rv = stepThrough.newApi(expressionNode, options)
  }
  catch (err) {
    throw err // Todo - handle error
  }

  return rv
}
function isOkAsSymbolicExpression(expressionAsText) {
  let rv = false
  if (expressionAsText && (expressionAsText.search(/-\s*-/) === -1)) {
    try {
      const expressionNode = parseText(`${expressionAsText}*1`)
      const steps = stepThrough.oldApi(expressionNode)
      rv = (steps.length > 0)
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (e) {
      // Hide exceptions.
    }
  }
  return rv
}
function kemuSolveEquation(options) {
  const equation = new Equation(options)
  EquationSolver.solveEquation(equation)
  return equation
}
function solveEquation(x) {
  if (typeof (x) !== 'object')
    throw 'error: options object expected'

  return kemuSolveEquation(x)
}
function normalizeExpression(text) {
  let rv = '[?]'
  try {
    rv = print(parseText(text))
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err) {
    rv = '[error]'
  }
  return rv
}
function registerPreprocessorBeforeParse(cb) {
  ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE.push(cb)
}
function registerPreprocessorAfterParse(cb) {
  ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE.push(cb)
}
export { simplifyExpression }
export { solveEquation }
export { kemuSolveEquation }
export { ChangeTypes }
export { normalizeExpression }
export { print }
export { printAsTeX }
export { compareByText }
export { math }
export { convertTextToTeX }
export { parseText }
export { isOkAsSymbolicExpression }
export { Node }
export { registerPreprocessorBeforeParse }
export { registerPreprocessorAfterParse }
export default {
  simplifyExpression,
  solveEquation,
  kemuSolveEquation,
  ChangeTypes,
  normalizeExpression,
  print,
  printAsTeX,
  compareByText,
  math,
  FunctionNode: math.FunctionNode,
  convertTextToTeX,
  parseText,
  isOkAsSymbolicExpression,
  Node,
  registerPreprocessorBeforeParse,
  registerPreprocessorAfterParse,
}
