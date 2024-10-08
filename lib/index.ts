/* eslint-disable no-throw-literal */
import type { MathNode } from 'mathjs'
import type { AChangeType, AChangeTypeCore, AChangeTypeGroup, AChangeTypeOnly, AChangeTypeWithCase, AEquationChangeType, AMistakeTypeOnly, EQUATION_CHANGE_TYPES, EquationChangeTypes } from './types/changeType/ChangeTypes'
import math from '~/config'
import clone from '~/newServices/nodeServices/clone.js'
import { assessUserEquationStep, assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import Equation from './kemuEquation/Equation.js'
import EquationSolver from './kemuEquation/EquationSolver.js'
import stepThrough from './simplifyExpression/index.js'
import { kemuNormalizeConstantNodes } from './simplifyExpression/kemuSimplifyCommonServices.js'
import { assessUserStep, assessUserSteps } from './simplifyExpression/stepEvaluationCore'

import { changeTypeIsInGroup, convertAdditionToSubtractionErrorType, convertMistakeOnlyTypeToItsChangeType, doesChangeTypeEqual, getChangeTypeGroups, getEveryChangeIdApplicable, getRootChangeType, isChangeTypeInGroup, isMistakeTypeOnly, isSameRootChangeType } from './types/changeType/changeAndMistakeUtils.js'
import { ChangeTypes } from './types/changeType/ChangeTypes'
import { ascii, latex } from './util/print.js'


const print = ascii
const printLatex = latex
const CACHE_ENABLED = true
const CACHE_LOG_MISSING_ENABLED = false
const CACHE_LOG_REUSED_ENABLED = false
const CACHE_COMPARE: Record<string, number> = {}
const CACHE_TEXT_TO_TEX: Record<string, string> = {}
const CACHE_TEXT_TO_NODE: Record<string, MathNode> = {}

// Stack of caller registered preprocess function.
// Empty by default.
const ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE: ((text: string) => string)[] = []
const ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE: ((node: MathNode) => MathNode)[] = []

function _compareByTextInternal(x: string, y: string): number {
  try {
    return <number>math.compare(x, y)
  }

  catch (err) {
    return Number.NaN
  }
}

function _postProcessResultTeX(resultTeX: string): string {
  // Don't use x := y definitions.
  // We want x = y everywhere.
  return resultTeX.replace(':=', '=')
}

function printAsTeX(node: MathNode): string {
  return _postProcessResultTeX(printLatex(node))
}

function compareByText(x: string, y: string): number {
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

function _convertTextToTeXInternal(text: string): string {
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

function convertTextToTeX(text: string): string {
  let rv = text
  if (text && text.trim() !== '') {
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

/*
function _kemuNormalizeMultiplyDivision(node: MathNode): MathNode {
  if (isOperatorNode(node) && node.op === '/') {
    const nodeTop = node.args[0]
    const nodeBottom = node.args[1]
    if (
      isOperatorNode(nodeTop)
      && nodeTop.op === '*'
      && isOperatorNode(nodeTop.args[0])
      && nodeTop.args[0].op === '/'
      && isOperatorNode(node)
    ) {
      const nodeCd = node
      node = node.args[0]
      nodeCd.args = [nodeTop.args[1], nodeBottom]
      // @ts-expect-error ---
      node.args[1] = nodeCd
    }
  }
  if (isOperatorNode(node) && node.args) {
    node.args.forEach((oneArg, idx) => {
      // eslint-disable-next-line ts/strict-boolean-expressions
      if (oneArg)
        node.args[idx] = _kemuNormalizeMultiplyDivision(oneArg)
    })
  }
  return node
}
*/
function _parseTextInternal(text: string): MathNode {
  // Preprocess text before passing in to mathjs parser if needed.
  ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE.forEach((preprocessFct) => {
    text = preprocessFct(text)
  })

  ///  QUICK_FIX. This is a quick fix to make occurrences of 0x to 0. It was breaking parsing.
  text = text.replaceAll(/\b0[a-z]\b/gi, '0')

  // Process text into node.
  let rv = math.parse(text)
  // Make sure we store all constant nodes as bignumber to avoid fake unequals.
  rv = kemuNormalizeConstantNodes(rv)
  // rv = _kemuNormalizeMultiplyDivision(rv)
  // Preprocess just generated node tree if needed.
  ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE.forEach((preprocessFct) => {
    rv = preprocessFct(rv)
  })
  return rv
}

function parseText(text: string): MathNode {
  let rv: MathNode | null = null
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
  return <MathNode>rv
}

interface SimplifyOptions {
  expressionAsText?: string
  expressionNode?: MathNode
}

function simplifyExpression(optionsOrExpressionAsText: SimplifyOptions | string): any {
  let rv = null
  // eslint-disable-next-line no-useless-catch
  try {
    let expressionNode: MathNode | null = null
    let options: SimplifyOptions = {}
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

function isOkAsSymbolicExpression(expressionAsText: string): boolean {
  let rv = false
  if (expressionAsText && expressionAsText.search(/-\s*-/) === -1) {
    try {
      const expressionNode = parseText(`${expressionAsText}*1`)
      const steps = stepThrough.oldApi(expressionNode)
      rv = steps.length > 0
    }

    catch (e) {
      // Hide exceptions.
    }
  }
  return rv
}

function kemuSolveEquation(options: any): Equation {
  const equation = new Equation(options)
  EquationSolver.solveEquation(equation)
  return equation
}

function solveEquation(x: any): Equation {
  if (typeof x !== 'object')
    throw 'error: options object expected'

  return kemuSolveEquation(x)
}

function normalizeExpression(text: string): string {
  let rv = '[?]'
  try {
    rv = print(parseText(text))
  }


  catch (_err: unknown) {
    rv = '[error]'
  }
  return rv
}

function registerPreprocessorBeforeParse(cb: (text: string) => string): void {
  ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE.push(cb)
}

function registerPreprocessorAfterParse(cb: (node: MathNode) => MathNode): void {
  ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE.push(cb)
}

export type{
  AChangeType,
  AChangeTypeCore,
  AChangeTypeGroup,
  AChangeTypeOnly,
  AChangeTypeWithCase,
  AEquationChangeType,
  AMistakeTypeOnly,
}
export {
  // Equation evaluation
  assessUserEquationStep,
  assessUserEquationSteps,

  assessUserStep,
  assessUserSteps,
  changeTypeIsInGroup,
  ChangeTypes,
  compareByText,
  convertAdditionToSubtractionErrorType,
  convertMistakeOnlyTypeToItsChangeType,
  convertTextToTeX,
  doesChangeTypeEqual,
  EQUATION_CHANGE_TYPES,
  EquationChangeTypes,
  getChangeTypeGroups,
  getEveryChangeIdApplicable,
  // Change type utils
  getRootChangeType,
  isChangeTypeInGroup,
  isMistakeTypeOnly,
  //
  isOkAsSymbolicExpression,
  isSameRootChangeType,
  kemuSolveEquation,
  math,
  normalizeExpression,
  parseText,
  print,
  printAsTeX,
  registerPreprocessorAfterParse,
  registerPreprocessorBeforeParse,
  simplifyExpression,
  solveEquation,
}

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
  registerPreprocessorBeforeParse,
  registerPreprocessorAfterParse,
}
