import type { MathNode } from 'mathjs'
import { describe, expect, it } from 'vitest'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization'
import { parseText } from '~/newServices/nodeServices/parseText'
import { cleanString } from '~/util/stringUtils'

describe('equalityTest', () => {
  const testCases: { input: string, expected: string }[] = [
    { input: '(-2)/-2', expected: '-2/-2' },
    // swapped negative cases
    { input: '-4x+7', expected: '7-4x' },
    { input: '-4x+7', expected: '7+-4x' },

    //
    { input: '(5+-2)*x+-2', expected: '-2+(-2+5)*x' },

    // single x cases
    { input: '1*x', expected: 'x' },
    { input: '1x', expected: 'x' },
    { input: 'x', expected: 'x' },
    // doesn't divide equally. so we say its equal to its decimal form
    { input: '5/2', expected: '2.5' },


    // Simple cases with random + and -
    { input: '5 + 3 - 2', expected: '3 + 5 - 2' },
    { input: '10 - 3 + 7', expected: '7 + 10 - 3' },
    { input: '20 + 5 - 10', expected: '5 + 20 - 10' },
    { input: '6 + 4 - 8', expected: '4 + 6 - 8' },
    { input: '15 - 7 + 2', expected: '15 + 2 - 7' },
    { input: '30 + 10 - 5', expected: '10 + 30 - 5' },
    { input: '50 - 20 + 15', expected: '15 + 50 - 20' },

    // More complex random +- cases
    { input: '3 + 5 - 2 + 8', expected: '5 + 8 + 3 - 2' },
    { input: '12 - 7 + 4 - 2', expected: '4 + 12 - 7 - 2' },
    { input: '25 + 10 - 5 + 8', expected: '10 + 8 + 25 - 5' },
    { input: '50 - 20 + 30 - 15', expected: '30 + 50 - 15 - 20' },
    { input: '18 + 6 - 4 + 2', expected: '6 + 2 + 18 - 4' },
    { input: '40 - 15 + 25 - 10', expected: '25 + 40 - 10 - 15' },
    { input: '100 + 20 - 30 + 5', expected: '20 + 5 + 100 - 30' },

    // Edge cases with negative numbers
    { input: '-5 + 3 - 2', expected: '3 - 5 - 2' },
    { input: '-10 - 3 + 7', expected: '7 - 10 - 3' },
    { input: '-20 + 5 - 10', expected: '5 - 20 - 10' },
    { input: '-6 + 4 - 8', expected: '4 - 6 - 8' },
    { input: '-15 - 7 + 2', expected: '2 - 15 - 7' },
    { input: '-30 + 10 - 5', expected: '10 - 30 - 5' },
    { input: '-50 - 20 + 15', expected: '15 - 50 - 20' },

    // Cases with multiple negative and positive numbers
    { input: '-3 + -5 - 2 + 8', expected: '8 - 3 - 5 - 2' },
    { input: '12 - 7 + -4 - 2', expected: '12 - 7 - 4 - 2' },
    { input: '25 + -10 - 5 + -8', expected: '25 - 10 - 5 - 8' },
    { input: '50 - 20 + -30 - 15', expected: '50 - 20 - 30 - 15' },
    { input: '-18 + -6 - 4 + 2', expected: '2 - 18 - 6 - 4' },
    { input: '-40 - 15 + -25 - 10', expected: '-40 - 15 - 25 - 10' },
    { input: '-100 + 20 - -30 + 5', expected: '20 + 30 + 5 - 100' },

    // Combining positive and negative numbers randomly
    { input: '7 + -2 - 3 + 5', expected: '5 + 7 - 2 - 3' },
    { input: '-12 + 3 - -4 - 8', expected: '3 + 4 +- 8 - 12' },
    { input: '15 - -5 + -2 + 7', expected: '15 + 5 + 7 - 2' },
    { input: '-20 + 10 + -5 - -2', expected: '10 + 2 +- 20 - 5' },
    { input: '50 - -25 + -10 + 30', expected: '50 + 25 + 30 - 10' },
    { input: '-100 + -20 - 5 + 15', expected: '15 - 100 - 20 - 5' },
    { input: '-75 - -50 + 25 - 10', expected: '50 - 10 - 75 + 25' },

    // Additional edge cases with signs
    { input: '-3 - 5 + 2', expected: '2 - 3 - 5' },
    { input: '8 + -6 - 3 + 1', expected: '1 + 8 - 6 - 3' },
    { input: '-10 - -7 + 4 - -2', expected: '4 + 2 + 7 - 10' },
    { input: '5 + 10 + -5 + -10', expected: '5 - 5 + 10 - 10' },
    { input: '-7 + 8 - -9 + -6', expected: '8 + 9 - 7 - 6' },

    // plus minus cases
    { input: '10-(2*4+2*3)', expected: '10+-(2*4+2*3)' },
    { input: '2-(2*4+2*3)/2', expected: '2+-(2*4+2*3)/2' },
    { input: '2-(2*4+2*3+-2)/2', expected: '2+-(2*4+2*3-2)/2' },
    { input: '2+-(2*-4+2*3+-2)/2', expected: '2-(2*-4+2*3-2)/2' },
  ]

  testCases.forEach(({ input, expected }) => {
    it(` "${input}" equals "${expected}"`, () => {
      expected = cleanString(expected)
      input = cleanString(input)
      const expression: MathNode = parseText(input)

      const isEqual = areExpressionEqual((expression), (expected))
      expect(isEqual).toBe(true)
    })
  })
})
