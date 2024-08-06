import { assert, describe, it } from 'vitest'
import mathsteps from '~/index.js'
import checks from '~/checks/index.js'

describe('arithmetic stepping', () => {
  it('4 + sqrt(16)', () => {
    assert.deepEqual(
      checks.hasUnsupportedNodes(mathsteps.parseText('4 + sqrt(4)')),
      false,
    )
  })

  it('x = 5 no support for assignment', () => {
    assert.deepEqual(
      checks.hasUnsupportedNodes(mathsteps.parseText('x = 5')),
      true,
    )
  })

  it('x + (-5)^2 - 8*y/2 is fine', () => {
    assert.deepEqual(
      checks.hasUnsupportedNodes(mathsteps.parseText('x + (-5)^2 - 8*y/2')),
      false,
    )
  })

  it('nthRoot() with no args has no support', () => {
    assert.deepEqual(
      checks.hasUnsupportedNodes(mathsteps.parseText('nthRoot()')),
      true,
    )
  })
})
