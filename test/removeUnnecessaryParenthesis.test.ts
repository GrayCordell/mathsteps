import { describe, expect, it } from 'vitest'
import { myNodeToString, parseText } from '~/index'
import { removeUnnecessaryParentheses } from '~/newServices/nodeServices/removeUnnessaryParenthesis'

describe('removeUnnecessaryParentheses', () => {
  const testCases = [
    { input: '17-(7*4/2)', expected: '17-7*4/2', description: 'removes unnecessary parentheses around a negative collection of terms' },
    { input: '(5)', expected: '5', description: 'removes redundant parentheses around constants' },
    { input: '(x)', expected: 'x', description: 'removes redundant parentheses around symbols' },
    { input: '((x + y))', expected: 'x + y', description: 'removes unnecessary nested parentheses' },
    { input: '(x + y) * z', expected: '(x + y) * z', description: 'preserves necessary parentheses for operator precedence' },
    { input: '(((x + y) * z))', expected: '(x + y) * z', description: 'handles deeply nested parentheses' },
    { input: '((x + y) * (z + w))', expected: '(x + y) * (z + w)', description: 'handles mixed operator precedence correctly' },
    { input: '6 + (2 * 3 + 4) * 2', expected: '6 + (2 * 3 + 4) * 2', description: 'returns the same string for expressions without unnecessary parentheses' },
    { input: '-(-(x))', expected: '-(-x)', description: 'handles nested unary operators' },
    { input: '(a * (b + c)) + d', expected: 'a * (b + c) + d', description: 'preserves parentheses for clarity in mixed precedence' },
    { input: '(a + (b * c))', expected: 'a + b * c', description: 'removes unnecessary parentheses when precedence allows' },
    { input: '((a + b) * (c - d)) / e', expected: '(a + b) * (c - d) / e', description: 'handles division and nested parentheses correctly' },
    { input: 'sin((x))', expected: 'sin(x)', description: 'removes unnecessary parentheses around function arguments' },
    { input: '((x))', expected: 'x', description: 'reduces multiple layers of parentheses around a symbol' },
    { input: '((a) + ((b)))', expected: 'a + b', description: 'reduces complex nested parentheses with symbols' },
    { input: '(a + b) * (c + d)', expected: '(a + b) * (c + d)', description: 'preserves parentheses for clarity in distributive expressions' },
    { input: '(((a + b) * c) + d)', expected: '(a + b) * c + d', description: 'removes redundant outer parentheses in complex expressions' },
    { input: '(x * (y * (z)))', expected: 'x * y * z', description: 'removes redundant nested parentheses in chained multiplication' },
    { input: '(a + b) * (c / (d + e))', expected: '(a + b) * c / (d + e)', description: 'preserves necessary parentheses for division and addition' },
    { input: '(1)', expected: '1', description: 'removes parentheses around a single constant' },
    { input: '(((1 + 2)))', expected: '1 + 2', description: 'removes excessive parentheses around simple constants' },
    { input: '(a / (b + c)) + d', expected: 'a / (b + c) + d', description: 'preserves parentheses for correct division' },
  ]

  const errorCases = [
    { input: '', description: 'throws an error for empty input' },
    { input: '(x +', description: 'throws an error for invalid input (unclosed parenthesis)' },
    { input: '((x + y)', description: 'throws an error for invalid input (missing closing parenthesis)' },
    { input: '(((x))) +', description: 'throws an error for incomplete expression' },
    { input: '(a * (b + (c))) +', description: 'throws an error for incomplete expression with nested parentheses' },
    { input: '(', description: 'throws an error for single opening parenthesis' },
    { input: ')', description: 'throws an error for single closing parenthesis' },
    { input: '()', description: 'throws an error for empty parentheses' },
  ]


  // Helper functions to clean and compare strings
  const betterCleanStringFn = (str: string) => myNodeToString(parseText(str.replace(/\+-/g, '-')))
  const cleanRemoveUnnecessaryParenthesesFn = (input: string) => betterCleanStringFn(myNodeToString(removeUnnecessaryParentheses(betterCleanStringFn(input))))

  // Run test cases
  testCases.forEach(({ input, expected, description }) => {
    it(description, () => {
      expect(cleanRemoveUnnecessaryParenthesesFn(input)).toBe(betterCleanStringFn(expected))
    })
  })

  errorCases.forEach(({ input, description }) => {
    it(description, () => {
      expect(() => cleanRemoveUnnecessaryParenthesesFn(input)).toThrow()
    })
  })
})


