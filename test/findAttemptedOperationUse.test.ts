import { describe, expect, it } from 'vitest'
import { findAttemptedOperationUseCore } from '~/simplifyExpression/rules/stepEvaluationOnly/findAttemptedOperationUse'
/* THESE FAIL RIGHT NOW
    {
    description: 'REARRANGE  for division occurring after addition 2',
    from: '3 + 5 + (8 / 2) + 2',
    to: '(8 / 2) + 3 + 7', // moved 8 / 2 to the front first: '(8 / 2) + 3 + 5 + 2'
    expected: { opResult: '7', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },
    {
    description: 'REARRANGE position should not matter for addition only.',
    from: '5 + 3 + 2 + 4',
    to: '2 + 5 + 7', // changed to '2 + 5 + 3 + 4'first (did 3 + 4)
    expected: { opResult: '7', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },
  /*  {
    description: 'REARRANGE with subtraction in it.  for addition and when numbers are moved around and the subtraction numbers stay the same',
    from: '5 + -3 + 2 + 4',
    to: '-3 + 2 + 9', // changed to '-3 + 2 + 4 + 5'first (did 4 + 5)
    expected: { opResult: '9', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },
{
  description: 'REARRANGE seperated addition and a multiplied number',
    from: '5 * 3 + 2 + 4',
  to: '3 * 3 + 4',
  expected: { opResult: '3', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
},
  {
    description: 'when negative values are involved in addition and subtraction',
    from: '1 + 2 + 2 + 1x - 3 - 2',
    to: '1 + 4 + 1x - 3 - 2',
    expected: { opResult: '4', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },
   {
    description: 'for complex expression simplification involving parenthesis',
    from: '2 * (3 + 4) - 5 / (1 + 1)',
    to: '2 *   (22   ) - 5 / (1 + 1)',
    expected: { opResult: '22', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },

{
  description: 'when negative values are involved in addition and subtraction. Finds Multiplication',
    from: '1 + 2 + 2 + 1x - 3 - 2 * (6 / 2)',
  to: '1 + 2 + 2 + 1x - 3 - (12 / 2)',
  expected: { opResult: '12', changeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY' },
      {
    description: 'Addition with multiple terms first and last term is removed',
    from: '1 + 2 + 3 + 4 + 5 + 5 + 5',
    to: '6 + 2 + 3 + 4 + 5 + 5',
    expected: { opResult: '6', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
  },
 */

describe('findAttemptedOperationUse', () => {
  const testCases = [
    {
      description: 'when an addition operation is simplified. Has Addition & Subtraction.',
      from: '5 + 3 - 2',
      to: '10 - 2',
      expected: { opResult: '10', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
    },
    {
      description: 'when an subtration operation is simplified. Has Addition & Subtraction & variable. ',
      from: '10 - 7x + 4 * 3x',
      to: '22 + 4 * 3x',
      expected: { opResult: '22', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },
    {
      description: 'when an addition operation is simplified. Has Addition & Subtraction. 2',
      from: '5 + 3 - 2',
      to: '5 + 1',
      expected: { opResult: '1', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },
    {
      description: 'should not care about the order of operations. Addition with parenthesis instead of subtraction',
      from: '5 + (3 - 2)',
      to: '3 + 3',
      expected: { opResult: '3', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },

    {
      description: 'for subtraction when an operator and numbers are simplified',
      from: '8 - 3',
      to: '5',
      expected: { opResult: '5', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },
    {
      description: 'for multiplication when an operator and numbers are simplified',
      from: '4 * 2',
      to: '8',
      expected: { opResult: '8', changeType: 'SIMPLIFY_ARITHMETIC__MULTIPLY' },
    },
    {
      description: 'for division when an operator and numbers are simplified',
      from: '8 / 2',
      to: '4',
      expected: { opResult: '4', changeType: 'SIMPLIFY_ARITHMETIC__DIVIDE' },
    },
    {
      description: 'for division occurring after addition',
      from: '3 + 5 + 8 / 2',
      to: '3 + 5 + 4',
      expected: { opResult: '4', changeType: 'SIMPLIFY_ARITHMETIC__DIVIDE' },
    },
    {
      description: 'should return null if no arithmetic operation is simplified (no change in numbers or operators)',
      from: '5',
      to: '5',
      expected: null,
    },
    {
      description: 'should return null if an operator is added instead of removed',
      from: '3',
      to: '3 + 2',
      expected: null,
    },

    {
      description: 'should return null 22',
      from: '(5 + 3) - (2 + 1)',
      to: '8 - 3',
      expected: null,
    },
    {
      description: 'should return null for mixed operations where not all operations were simplified correctly',
      from: '5 + 3 * 2 - 4 / 2',
      to: '5 + 6 - 2',
      expected: null,
    },
    {
      description: 'should return null if invalid number of operators and terms remain after simplification',
      from: '3c + 2 + 3c',
      to: '2 + 5c + 3c',
      expected: null,
    },
    // TODO? Not working right now
    // {
    //   description: 'for invalid simplification with variable terms',
    //   from: '3c + 2 + 3c',
    //   to: '5c + 3c',
    //   expected: { opResult: '5c', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
    // },
    {
      description: 'for floating point number addition',
      from: '5.5 + 2.3',
      to: '7.8',
      expected: { opResult: '7.8', changeType: 'SIMPLIFY_ARITHMETIC__ADD' },
    },

    {
      description: 'subtraction producing negative',
      from: '3 - 4 - 5',
      to: '-1 - 5',
      expected: { opResult: '-1', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },
    {
      description: 'for simplification where terms are grouped or moved (variable terms)',
      from: '3x - 4x - 5y',
      to: '5x - 5y',
      expected: { opResult: '5x', changeType: 'SIMPLIFY_ARITHMETIC__SUBTRACT' },
    },
    {
      description: 'should return null for invalid variable operations (operators change but result is not simplified)',
      from: 'a + b',
      to: 'a * b',
      expected: null,
    },
    {
      description: 'when negative values are involved in addition and subtraction. Finds Division',
      from: '1 + 2 + 2 + 1x - 3 - 2 * (6 / 2)',
      to: '1 + 2 + 2 + 1x - 3 - 2 * 3',
      expected: { opResult: '3', changeType: 'SIMPLIFY_ARITHMETIC__DIVIDE' },
    },


  ]
  testCases.forEach(({ description, from, to, expected }) => {
    it(description, () => {
      const result = findAttemptedOperationUseCore(from, to)

      if (result === null || expected === null) {
        expect(result).toEqual(expected)
      }
      else if (result) {
        expect(result.opResult).toEqual(expected.opResult)
        // expect(result.isBasedOnPosition || false).toEqual(expected.isBasedOnPosition)
        expect(result.changeType).toEqual(expected.changeType)
      }
    })
  })
})

