// detectCrossMultiplication.ts & crossMultiplicationDetection.test.ts combined
import type { MathNode } from 'mathjs'
import { describe, expect, it } from 'vitest'
import { parseText } from '~/index'
import { crossMatchEquals, detectCrossMultiplication, getCrossMultiplication } from '~/kemuEquation/Special-CrossMultiplication'
import { kemuFlatten } from '~/simplifyExpression/kemuSimplifyCommonServices.js'

const makeNodeFn = (str: string): MathNode => kemuFlatten(parseText(str))

describe('detectCrossMultiplication', () => {
  it('detects valid cross multiplication', () => {
    const step1 = '(2/x)=(10/13)'
    const step2 = '26=10x'
    const step2ButNotSimplified = '(2*13)=10*x'

    const result = detectCrossMultiplication(step1, step2)

    const result2 = getCrossMultiplication(step1.split('=')[0], step1.split('=')[1])
    if (result2 === null)
      return expect(result2).not.toBe(null)

    const equalsStep2 = crossMatchEquals({ givenLeft: makeNodeFn(step2ButNotSimplified.split('=')[0]), givenRight: makeNodeFn(step2ButNotSimplified.split('=')[1]), correctCrossLeft: result2.crossLeft, correctCrossRight: result2.crossRight })
    expect(result).toBe(true)
    expect(equalsStep2).toBe(true)
  })

  it('detects valid cross multiplication with reversed sides', () => {
    const step1 = '(5/y)=(3/z)'
    const step2 = '5z=3y'

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(true)
  })

  it('returns false for invalid equation formats', () => {
    const step1 = '5/x' // Missing equals sign
    const step2 = '5x=10'

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(false)
  })

  it('returns false for non-fraction equations', () => {
    const step1 = '2x=3'
    const step2 = '6=2x'

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(false)
  })

  it('returns false for non-cross multiplication transformations', () => {
    const step1 = '(2/x)=(10/13)'
    const step2 = '13x=20' // Incorrect cross multiplication

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(false)
  })

  it('returns false for valid fractions but mismatched operations', () => {
    const step1 = '(a/b)=(c/d)'
    const step2 = 'ad = bc' // Should be 'a*d' but written differently

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(false)
  })

  it('detects cross multiplication with complex expressions', () => {
    const step1 = '((2x+3)/y)=(4/(x+5))'
    const step2 = '(2x+3)*(x+5)=4y'

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(true)
  })

  it('returns false for unmatched cross multiplication components', () => {
    const step1 = '(3/x)=(7/9)'
    const step2 = '3x=63' // Incorrectly computed

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(false)
  })

  it('handles whitespace and formatting differences', () => {
    const step1 = '( 2 / x ) = ( 10 / 13 )'
    const step2 = '10 * x = 26'

    const result = detectCrossMultiplication(step1, step2)

    expect(result).toBe(true)
  })
})

