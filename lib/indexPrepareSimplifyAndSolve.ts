/**
 * @file indexPrepareSimplifyAndSolve.ts
 * @description
 * There were many functions initially scattered in index.
 * I believe they should be imported from appropriate locations, so I have been slowly moving them.
 * Here I am placing the solveEquation and simplifyExpression for now. They wrap the apis.
 */
import type { MathNode } from 'mathjs'
import Equation from '~/kemuEquation/Equation'
import EquationSolver from '~/kemuEquation/EquationSolver'
import { parseText } from '~/newServices/nodeServices/parseText'
import stepThrough from '~/simplifyExpression'


export interface SimplifyOptions {
  expressionAsText?: string
  expressionNode?: MathNode
  isDebugMode?: boolean
  expressionCtx?: any
  getMistakes?: boolean
  getAllNextStepPossibilities?: boolean
  // eslint-disable-next-line ts/no-unsafe-function-type
  onStepCb?: Function
}

export const simplifyExpression = (optionsOrExpressionAsText: SimplifyOptions | string): any => {
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
      // eslint-disable-next-line no-throw-literal
      throw 'missing expression'

    // Simplify expression.
    rv = stepThrough.newApi(expressionNode, options)
  }
  catch (err) {
    throw err // Todo - handle error
  }

  return rv
}

// eslint-disable-next-line ts/no-unsafe-function-type
interface SolveEquationOptions { leftNode?: any, rightNode?: any, comparator?: any, unknownVariable: any, equationAsText: string, parent?: any, onStepCb?: Function, id?: any }
export function solveEquation(options: SolveEquationOptions): Equation {
  const equation = new Equation(options)
  EquationSolver.solveEquation(equation)
  return equation
}

/* function normalizeExpression(text: string): string {
  let rv = '[?]'
  try {
    rv = print(parseText(text))
  }


  catch (_err: unknown) {
    rv = '[error]'
  }
  return rv
} */
/* function _compareByTextInternal(x: string, y: string): number {
  try {
    return <number>math.compare(x, y)
  }

  catch (err) {
    return Number.NaN
  }
} */
/*
export function compareByText(x: string, y: string): number {
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
*/
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
