import Util from '~/util/Util'
import { afterEach, beforeEach,assert, describe, expect, it } from 'vitest'

describe('appendToArrayInObject', function () {
  it('creates empty array', function () {
    const object = {}
    Util.appendToArrayInObject(object, 'key', 'value')
    assert.deepEqual(
      object,
      {'key': ['value']}
    )
  })
  it('appends to array if it exists', function () {
    const object = {'key': ['old_value']}
    Util.appendToArrayInObject(object, 'key', 'new_value')
    assert.deepEqual(
      object,
      {'key': ['old_value', 'new_value']}
    )
  })
})
