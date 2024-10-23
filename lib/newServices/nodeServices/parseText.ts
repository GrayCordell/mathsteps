import type { MathNode } from 'mathjs'
import math from '~/config'
import clone from '~/newServices/nodeServices/clone'
import stepThrough from '~/simplifyExpression'
import { kemuNormalizeConstantNodes } from '~/simplifyExpression/kemuSimplifyCommonServices'
import { printAscii, printLatex } from '~/util/print'

export const print = printAscii
const CACHE_ENABLED = true
const CACHE_LOG_MISSING_ENABLED = false
const CACHE_LOG_REUSED_ENABLED = false
// const CACHE_COMPARE: Record<string, number> = {}
const CACHE_TEXT_TO_TEX: Record<string, string> = {}
const CACHE_TEXT_TO_NODE: Record<string, MathNode> = {}

// Stack of caller registered preprocess function.
// Empty by default.
const ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE: ((text: string) => string)[] = []
const ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE: ((node: MathNode) => MathNode)[] = []
export const registerPreprocessorBeforeParse = (cb: (text: string) => string): void => {
  ARRAY_OF_PREPROCESS_FUNCTIONS_BEFORE_PARSE.push(cb)
}
export const registerPreprocessorAfterParse = (cb: (node: MathNode) => MathNode): void => {
  ARRAY_OF_PREPROCESS_FUNCTIONS_AFTER_PARSE.push(cb)
}

const _postProcessResultTeX = (resultTeX: string): string => {
  // Don't use x := y definitions.
  // We want x = y everywhere.
  return resultTeX.replace(':=', '=')
}
export function printAsTeX(node: MathNode): string {
  return _postProcessResultTeX(printLatex(node))
}


const _convertTextToTeXInternal = (text: string): string => {
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

export function convertTextToTeX(text: string): string {
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

const _parseTextInternal = (text: string): MathNode => {
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

export function parseText(text: string): MathNode {
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


export const isOkAsSymbolicExpression = (expressionAsText: string): boolean => {
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
