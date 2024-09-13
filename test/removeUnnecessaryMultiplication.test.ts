import type { MathNode } from 'mathjs'
import { describe, expect, it } from 'vitest'
import { parseText } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { removeUnnecessaryMultiplications } from '~/newServices/nodeServices/removeUnnecessaryMultiplications'
import { cleanString } from '~/util/stringUtils'

describe('removeUnnecessaryMultiplications', () => {
  const testCases: { input: string, expected: string }[] = [
    { input: '8+1*2/4*4', expected: '8+2/4*4' },
    { input: '1 * 2', expected: '2' },
    { input: '2 * 1', expected: '2' },
    { input: '(1 * 2) / (2 * 1)', expected: '2 / 2' },
    { input: '3 * 1 * 4', expected: '3 * 4' },
    { input: '1 * 1 * 5', expected: '5' },
    { input: '1', expected: '1' },
    { input: 'x * 1', expected: 'x' },
    { input: '1 * x', expected: 'x' },
    { input: 'x * y * 1', expected: 'x * y' },
    { input: '1 * (x + 1)', expected: 'x + 1' },
    { input: '(x + 1) * 1', expected: 'x + 1' },
  ]

  testCases.forEach(({ input, expected }) => {
    it(`removes unnecessary *1 from "${input}" and simplifies to "${expected}"`, () => {
      expected = cleanString(expected)
      input = cleanString(input)
      const expression: MathNode = parseText(input)

      const simplifiedExpression: MathNode = removeUnnecessaryMultiplications(expression)

      expect(cleanString(myNodeToString(simplifiedExpression))).toBe(cleanString(expected))
    })
  })
})
