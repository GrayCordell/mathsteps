import checks from '~/checks/index.js'
import TestUtil from '../TestUtil.js'
import { describe } from 'vitest'

function testResolvesToConstant(exprString, resolves) {
  TestUtil.testBooleanFunction(checks.resolvesToConstant, exprString, resolves)
}

describe('resolvesToConstant', () => {
  const tests = [
    ['(2+2)', true],
    ['10', true],
    ['((2^2 + 4)) * 7 / 8', true],
    ['2 * 3^x', false],
    ['-(2) * -3', true],
  ]
  tests.forEach(t => testResolvesToConstant(t[0], t[1]))
})
