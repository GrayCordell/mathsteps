import Node from '~/node'
import TestUtil from '../TestUtil'
import { afterEach, beforeEach,assert, describe, expect, it } from 'vitest'

function testIsPolynomialTerm(exprStr, isTerm) {
  TestUtil.testBooleanFunction(Node.Type.isPolynomialTerm, exprStr, isTerm)
}

describe('classifies symbol terms correctly', function() {
  const tests = [
    ['x', true],
    ['x^2', true],
    ['y^55', true],
    ['y^4/4', true],
    ['5y/3', true],
    ['x^y', true],
    ['3', false],
    ['2^5', false],
    ['x*y^5', false],
    ['-12y^5/-3', true],
  ]
  tests.forEach(t => testIsPolynomialTerm(t[0], t[1]))
})
