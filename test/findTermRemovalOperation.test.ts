import { describe, expect, it } from 'vitest'
import { findTermRemovalOperation } from '~/newServices/nodeServices/termRemovalOperations'


// Basic test case: single operation removal
describe('findTermRemovalOperation - Basic Operations', () => {
  it('should return the correct transformation for 5x + 5 to 5x', () => {
    const result = findTermRemovalOperation('5x + 5', '5x')
    expect(result).toEqual({
      op: '+',
      number: '5',
    })
  })

  it('should return the correct transformation for 10x - 3 to 10x', () => {
    const result = findTermRemovalOperation('10x - 3', '10x')
    expect(result).toEqual({
      op: '-',
      number: '3',
    })
  })

  it('should return the correct transformation for 8x * 2 to 8x', () => {
    const result = findTermRemovalOperation('8x * 2', '8x')
    expect(result).toEqual({
      op: '*',
      number: '2',
    })
  })

  it('should return the correct transformation for 6x / 2 to 6x', () => {
    const result = findTermRemovalOperation('6x / 2', '6x')
    expect(result).toEqual({
      op: '/',
      number: '2',
    })
  })
})

// Test case: no transformation possible
describe('findTermRemovalOperation - No Possible Transformation', () => {
  it('should return null for 5x + 5 to 10x', () => {
    const result = findTermRemovalOperation('5x + 5', '10x')
    expect(result).toBeNull()
  })

  it('should return null for expressions that have different structures', () => {
    const result = findTermRemovalOperation('2x^2 + 3', '2x')
    expect(result).toBeNull()
  })
})

// Test case: complex expressions
describe('findTermRemovalOperation - Complex Expressions', () => {
  it('should return the correct transformation for (3x + 5) + 2 to 3x + 5', () => {
    const result = findTermRemovalOperation('(3x + 5) + 2', '3x + 5')
    expect(result).toEqual({
      op: '+',
      number: '2',
    })
  })

  it('should return the correct transformation for 4x^2 + 7x - 5 to 4x^2 + 7x', () => {
    const result = findTermRemovalOperation('4x^2 + 7x - 5', '4x^2 + 7x')
    expect(result).toEqual({
      op: '-',
      number: '5',
    })
  })

  it('should handle nested operations: (5x + 3) * 2 to (5x + 3)', () => {
    const result = findTermRemovalOperation('(5x + 3) * 2', '(5x + 3)')
    expect(result).toEqual({
      op: '*',
      number: '2',
    })
  })
})

// Test case: removing the first term in addition/subtraction
describe('findTermRemovalOperation - First Term Removal', () => {
  it('should remove the first term in 5 + 3x to 3x', () => {
    const result = findTermRemovalOperation('5 + 3x', '3x')
    expect(result).toEqual({
      op: '+',
      number: '5',
    })
  })

  it('should remove the first term in 10 - 4x to -4x', () => {
    const result = findTermRemovalOperation('10 + -4x', '-4x')
    expect(result).toEqual({
      op: '+-',
      number: '10',
    })
  })
})

// Test case: invalid or malformed expressions
describe('findTermRemovalOperation - Invalid Input', () => {
  it('should return null if the from and to expressions are identical', () => {
    const result = findTermRemovalOperation('5x + 5', '5x + 5')
    expect(result).toBeNull()
  })
})

// Test case: operations with parentheses
describe('findTermRemovalOperation - Parentheses Handling', () => {
  it('should remove terms correctly with parentheses, (4x + 3) - 2 to 4x + 3', () => {
    const result = findTermRemovalOperation('(4x + 3) - 2', '4x + 3')
    expect(result).toEqual({
      op: '-',
      number: '2',
    })
  })

  it('should handle multiplication with parentheses, (3 + 5x) * 2 to (3 + 5x)', () => {
    const result = findTermRemovalOperation('(3 + 5x) * 2', '(3 + 5x)')
    expect(result).toEqual({
      op: '*',
      number: '2',
    })
  })
})


