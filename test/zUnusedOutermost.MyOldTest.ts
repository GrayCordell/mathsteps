/*
import { describe, expect, it } from 'vitest'
import { math } from '~/index'


function findOutermostElements(expression: string): { values: string[], operations: string[] } {
  const node = math.parse(expression)
  const outermostValues = new Set<string>()
  const outermostOperations = new Set<string>()

  function traverse(node: any, nestingLevel: number) {
    if (node.type === 'OperatorNode') {
      const isUnary = node.isUnary()
      const operatorIsExponent = node.op === '^'

      if (nestingLevel === 0) {
        if (isUnary) {
          outermostOperations.add(node.op === '-' ? 'unaryMinus' : node.op)
        }
        else {
          outermostOperations.add(node.op)
        }
      }

      // Increment nestingLevel for unary operators and exponentiation
      const newNestingLevel = (isUnary || operatorIsExponent) ? nestingLevel + 1 : nestingLevel

      node.args.forEach((arg: any) => {
        traverse(arg, newNestingLevel)
      })
    }
    else if (node.type === 'ParenthesisNode') {
      traverse(node.content, nestingLevel + 1)
    }
    else if (node.type === 'FunctionNode') {
      if (nestingLevel === 0) {
        outermostOperations.add(node.name)
      }
      // Increment nestingLevel when traversing into function arguments
      node.args.forEach((arg: any) => {
        traverse(arg, nestingLevel + 1)
      })
    }
    else if (node.type === 'ConstantNode' || node.type === 'SymbolNode') {
      if (nestingLevel === 0) {
        outermostValues.add(node.toString())
      }
    }
  }

  traverse(node, 0)

  return {
    values: Array.from(outermostValues),
    operations: Array.from(outermostOperations),
  }
}


// Test cases
describe('findOutermostElements', () => {
  it('finds the outermost values and operations in a simple expression', () => {
    const expression = '2 + 3 * (4 - x) / 6'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual(['2', '3', '6'])
    expect(outermostElements.operations.sort()).toEqual(['*', '+', '/'])
  })

  it('handles expressions with nested operations', () => {
    const expression = 'a + (b * (c + d))'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual(['a'])
    expect(outermostElements.operations.sort()).toEqual(['+'])
  })

  it('handles expressions with functions', () => {
    const expression = 'sin(x) + cos(y)'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual([])
    expect(outermostElements.operations.sort()).toEqual(['+', 'cos', 'sin'])
  })

  it('handles expressions with functions and constants', () => {
    const expression = '2 * sin(x) + 3 * cos(y)'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual(['2', '3'])
    expect(outermostElements.operations.sort()).toEqual(['*', '+', 'cos', 'sin'])
  })

  it('handles expressions with nested functions', () => {
    const expression = 'ln(exp(x) + 1)'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual([])
    expect(outermostElements.operations.sort()).toEqual(['ln'])
  })

  it('handles expressions with multiple layers of nesting', () => {
    const expression = '((1 + 2) * (3 + 4)) / ((5 + 6) * (7 + 8))'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual([])
    expect(outermostElements.operations.sort()).toEqual(['/'])
  })

  it('handles expressions with exponents', () => {
    const expression = 'x^2 + y^2'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual([])
    expect(outermostElements.operations.sort()).toEqual(['+', '^'])
  })

  it('handles expressions with negative numbers and unary operators', () => {
    const expression = '-a + b'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual(['b'])
    expect(outermostElements.operations.sort()).toEqual(['+', 'unaryMinus'])
  })

  it('handles complex expressions with functions and operations', () => {
    const expression = 'sqrt(a^2 + b^2) - tan(theta)'
    const outermostElements = findOutermostElements(expression)

    expect(outermostElements.values.sort()).toEqual([])
    expect(outermostElements.operations.sort()).toEqual(['-', 'sqrt', 'tan'])
  })
})
*/
