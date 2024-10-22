import { assert, it } from 'vitest'
import { parseText } from '~/newServices/nodeServices/parseText'
import { kemuFlatten } from '~/simplifyExpression/kemuSimplifyCommonServices.js'
import print from '../lib/util/print.js'

// TestUtil contains helper methods to share code across tests
const TestUtil = {}
// Takes in an input string and returns a flattened and parsed node
TestUtil.parseAndFlatten = function (exprString) {
  return kemuFlatten(parseText(exprString))
}
// Tests a function that takes an input string and check its output
TestUtil.testFunctionOutput = function (fn, input, output) {
  it(`${input} -> ${output}`, () => {
    assert.deepEqual(fn(input), output)
  })
}
// tests a function that takes in a node and returns a boolean value
TestUtil.testBooleanFunction = function (simplifier, exprString, expectedBooleanValue) {
  it(`${exprString} ${expectedBooleanValue}`, () => {
    const inputNode = kemuFlatten(parseText(exprString))
    assert.equal(simplifier(inputNode), expectedBooleanValue)
  })
}
// Tests a simplification function
TestUtil.testSimplification = function (simplifyingFunction, exprString, expectedOutputString) {
  it(`${exprString} -> ${expectedOutputString}`, () => {
    assert.deepEqual(print.ascii(simplifyingFunction(kemuFlatten(parseText(exprString))).rootNode), expectedOutputString)
  })
}
export default TestUtil
