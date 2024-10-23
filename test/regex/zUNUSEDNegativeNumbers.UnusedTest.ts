/*
 CURRENTLY UNUSED. May start using regex like this in the future.
* */
import { describe, expect, it } from 'vitest'
import { makeExtendedRegExp } from '~/util/extendedRegex'

export function extractNegativeNumbers(equation: string): string[] {
  const negativeNumberRegex = makeExtendedRegExp(String.raw`
        (?<!        # Start negative lookbehind to ensure the '-' is not preceded by:
            [\d\)]   # Any digit or closing parenthesis (to avoid capturing subtraction)
        )
        -           # Match a minus sign (indicating a negative number)
        \b          # Word boundary to ensure the '-' is part of a number, not an operator
        \d+         # Match one or more digits (whole number part)
        (\.\d+)?    # Optionally match a decimal point followed by one or more digits
        \b          # Word boundary to ensure it's a standalone number
    `, 'g')

  return equation.match(negativeNumberRegex) || []
}

describe('extractNegativeNumbers', () => {
  const testCases = [
    { input: '-5 + 3', expected: ['-5'], description: 'simple negative integers' },
    { input: 'x = -3.14 + 2', expected: ['-3.14'], description: 'negative decimals' },
    { input: 'y = -1.5 + (-2.5)', expected: ['-1.5', '-2.5'], description: 'negative decimals inside parentheses' },
    { input: 'a = b - 5', expected: [], description: 'subtraction operation (not a negative number)' },
    { input: '(-5) + 3', expected: ['-5'], description: 'negative number inside parentheses' },
    { input: 'x = -a + b', expected: [], description: 'negative sign before variables' },
    { input: 'x = -5 - -6', expected: ['-5', '-6'], description: 'multiple negatives with subtraction' },
    { input: 'x = -5 +-6', expected: ['-5', '-6'], description: 'multiple negatives with subtraction2' },
    { input: '-0.5 * 8', expected: ['-0.5'], description: 'negative decimal in multiplication' },
    { input: '3 + (-7) - (-4.2)', expected: ['-7', '-4.2'], description: 'multiple expressions with parentheses' },
  ]

  testCases.forEach(({ input, expected, description }) => {
    it(`should correctly handle: ${description}`, () => {
      const result = extractNegativeNumbers(input)
      expect(result).toEqual(expected)
    })
  })
})
