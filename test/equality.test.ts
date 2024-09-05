import { describe, expect, it } from 'vitest'
import type { MathNode } from 'mathjs'
import { removeUnnecessaryMultiplications } from '~/newServices/nodeServices/removeUnnecessaryMultiplications'
import { parseText } from '~/index'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { cleanString } from '~/util/stringUtils'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'

describe('equalityTest', () => {
  const testCases: { input: string, expected: string }[] = [
    { input: '8 + 4 * (2/4)', expected: '8+4*2/4' },
  ]

  testCases.forEach(({ input, expected }) => {
    it(` "${input}" equals "${expected}"`, () => {
      expected = cleanString(expected)
      input = cleanString(input)
      const expression: MathNode = parseText(input)

      const simplifiedExpression: MathNode = removeUnnecessaryMultiplications(expression)
      const first = cleanString(myNodeToString(simplifiedExpression))
      const second = cleanString(expected)
      const isEqual = areExpressionEqual(first, second)
      expect(isEqual).toBe(true)
    })
  })
})
