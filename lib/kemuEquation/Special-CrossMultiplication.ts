import type { MathNode } from 'mathjs'
import { isOperatorNode } from '~/config'
import { myNodeToString, parseText } from '~/index'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { kemuFlatten } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import { getAnswerFromStepAsNode } from '~/simplifyExpression/stepEvaluationHelpers'


/**
 * Parses an equation string into left and right MathNodes by splitting at '='.
 * @param equation - The equation string to parse.
 * @returns An object containing the left and right MathNodes.
 * @throws Will throw an error if the equation format is invalid.
 */
function parseEquationSides(equation: string): { left: MathNode, right: MathNode } {
  const sides = equation.split('=')
  if (sides.length !== 2) {
    throw new Error(`Invalid equation format: "${equation}"`)
  }
  const left = parseText(sides[0])
  const right = parseText(sides[1])
  return { left, right }
}

/**
 * Attempts to extract a fraction (A/B) node structure.
 * @param node - The MathNode to inspect.
 * @returns An object with numerator and denominator if the node is a fraction, otherwise null.
 */
function extractFractionSides(node: MathNode): { numerator: MathNode, denominator: MathNode } | null {
  if (isOperatorNode(node) && node.op === '/' && node.args.length === 2) {
    const [num, den] = node.args
    return { numerator: num, denominator: den }
  }
  return null
}
const countDivisionFn = (strOrNode: string | MathNode) => {
  const stringVersion = typeof strOrNode === 'string' ? strOrNode : myNodeToString(strOrNode)
  return stringVersion.split('/').length - 1
}

export function crossMatchEquals({ givenLeft, givenRight, correctCrossLeft, correctCrossRight }: { givenLeft: MathNode, givenRight: MathNode, correctCrossLeft: MathNode, correctCrossRight: MathNode }) {
  const isMatch1
    = areExpressionEqual(givenLeft, correctCrossLeft)
    && areExpressionEqual(givenRight, correctCrossRight)
  const isMatch2
    = areExpressionEqual(givenLeft, correctCrossRight)
    && areExpressionEqual(givenRight, correctCrossLeft)
  return isMatch1 || isMatch2
}

/**
 * Detects if the second step is a result of cross multiplication from the first step.
 * @param step1 - The initial equation in string format (e.g., "(2/x)=(10/13)").
 * @param step2 - The subsequent equation in string format (e.g., "10x=26").
 * @returns True if cross multiplication occurred, otherwise false.
 */
export function detectCrossMultiplication(step1: string, step2: string): boolean {
  let step1Sides, step2Sides

  try {
    step1Sides = parseEquationSides(step1)
    step2Sides = parseEquationSides(step2)

    if (!step1Sides || !step2Sides)
      return false
    if (countDivisionFn(step1Sides.left) !== 1 || countDivisionFn(step1Sides.right) !== 1)
      return false // Not a fraction-equals-fraction scenario
  }
  catch (error) {
    return false // Invalid equation format
  }

  const step1Left = kemuFlatten(step1Sides.left)
  const step1Right = kemuFlatten(step1Sides.right)
  const step2Left = kemuFlatten(step2Sides.left)
  const step2Right = kemuFlatten(step2Sides.right)

  const step1LeftFrac = extractFractionSides(step1Left)
  const step1RightFrac = extractFractionSides(step1Right)

  if (!step1LeftFrac || !step1RightFrac) {
    return false // Not a fraction-equals-fraction scenario
  }

  const step1LeftNum = step1LeftFrac.numerator
  const step1LeftDenom = step1LeftFrac.denominator
  const step1RightNum = step1RightFrac.numerator
  const step1RightDenom = step1RightFrac.denominator


  // Build the cross-multiplied expressions
  // It will simplify them both down(getAnswerFromStepAsNode) and compare them to the step2 sides. KemuFlatten may not be needed.
  const correctCrossLeft = kemuFlatten(getAnswerFromStepAsNode(`(${myNodeToString(step1LeftNum)}) * (${myNodeToString(step1RightDenom)})`))
  const correctCrossRight = kemuFlatten(getAnswerFromStepAsNode(`(${myNodeToString(step1LeftDenom)}) * (${myNodeToString(step1RightNum)})`))

  const simplifiedDownStep2Left = kemuFlatten(getAnswerFromStepAsNode(myNodeToString(step2Left)))
  const simplifiedDownStep2Right = kemuFlatten(getAnswerFromStepAsNode(myNodeToString(step2Right)))

  // Compare against step2's left and right sides
  return crossMatchEquals({ givenLeft: simplifiedDownStep2Left, givenRight: simplifiedDownStep2Right, correctCrossLeft, correctCrossRight })
}


/**
 * Extracts the cross-multiplied expressions from two fractions. (NOT SIMPLIFIED)
 */
export function getCrossMultiplication(_leftNode: MathNode | string, _rightNode: MathNode | string): { crossLeft: MathNode, crossRight: MathNode } | null {
  if (countDivisionFn(_leftNode) !== 1 || countDivisionFn(_rightNode) !== 1)
    return null // Not a fraction-equals-fraction scenario

  const leftNode = typeof _leftNode === 'string' ? kemuFlatten(parseText(_leftNode)) : _leftNode
  const rightNode = typeof _rightNode === 'string' ? kemuFlatten(parseText(_rightNode)) : _rightNode

  const leftFrac = extractFractionSides(leftNode)
  const rightFrac = extractFractionSides(rightNode)
  if (!leftFrac || !rightFrac)
    return null

  const leftNum = leftFrac.numerator
  const leftDenom = leftFrac.denominator
  const rightNum = rightFrac.numerator
  const rightDenom = rightFrac.denominator

  const crossLeft: MathNode = kemuFlatten(parseText(`(${myNodeToString(leftNum)}) * (${myNodeToString(rightDenom)})`))
  const crossRight: MathNode = kemuFlatten(parseText(`(${myNodeToString(leftDenom)}) * (${myNodeToString(rightNum)})`))

  return { crossLeft, crossRight }
}
