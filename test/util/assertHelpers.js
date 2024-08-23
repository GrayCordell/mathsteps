// assertHelpers.js
import { assert } from 'vitest'
import { cleanString } from '~/util/stringUtils.js'
import { areExpressionEqual } from '~/newServices/expressionEqualsAndNormalization.js'
import { removeCaseNumberFromRuleId } from '~/newServices/ruleHelper.js'

function _normalizeRulesProcedure(stepObject, expectedObject) {
  // clean strings
  for (const key of Object.keys(expectedObject)) {
    if (typeof expectedObject[key] === 'string')
      expectedObject[key] = cleanString(expectedObject[key])
    if (typeof stepObject[key] === 'string')
      stepObject[key] = cleanString(stepObject[key])
  }

  // remove COLLECT_AND_COMBINE_LIKE_TERMS from availableChangeTypes for now
  // Also lets remove the _CASE_1, _CASE_2, etc. from the ruleId.
  if (stepObject.availableChangeTypes) {
    stepObject.availableChangeTypes = stepObject.availableChangeTypes.filter(changeType => changeType !== 'COLLECT_AND_COMBINE_LIKE_TERMS')
    stepObject.availableChangeTypes = stepObject.availableChangeTypes.map(changeType => removeCaseNumberFromRuleId(changeType))
    stepObject.availableChangeTypes.sort()
  }
  if (stepObject.changeType)
    stepObject.changeType = removeCaseNumberFromRuleId(stepObject.changeType)

  if (expectedObject.availableChangeTypes) {
    expectedObject.availableChangeTypes = expectedObject.availableChangeTypes.filter(changeType => changeType !== 'COLLECT_AND_COMBINE_LIKE_TERMS')
    expectedObject.availableChangeTypes = expectedObject.availableChangeTypes.map(changeType => removeCaseNumberFromRuleId(changeType))
    expectedObject.availableChangeTypes.sort()
  }
  if (expectedObject.attemptedChangeType)
    expectedObject.attemptedChangeType = removeCaseNumberFromRuleId(expectedObject.attemptedChangeType)
  if (stepObject.attemptedChangeType)
    stepObject.attemptedChangeType = removeCaseNumberFromRuleId(stepObject.attemptedChangeType)
}

export function assertSpecifiedValues(stepObject, expectedObject) {
  // remove COLLECT_AND_COMBINE_LIKE_TERMS from availableChangeTypes for now
  // Also lets remove the _CASE_1, _CASE_2, etc. from the ruleId.
  _normalizeRulesProcedure(stepObject, expectedObject)

  for (const key in expectedObject) {
    let expectedValue = expectedObject[key]
    let actualValue = stepObject[key]
    if (expectedValue === undefined)
      continue
    if (typeof expectedValue === 'string')
      expectedValue = cleanString(expectedValue)
    if (typeof actualValue === 'string')
      actualValue = cleanString(actualValue)

    // These are math strings. And they can differ in formatting. Ex. (x+1) vs x+1 or 1+-5 vs 1-5 vs 1+(-5)
    if (key === 'from' || key === 'to' || key === 'attemptedToGetTo') {
      const isEqual = areExpressionEqual(actualValue, expectedValue)
      assert.isTrue(isEqual, `Expected "${key}" to be "${expectedValue}" but got "${actualValue}"`)
    }

    else {
      assert.deepEqual(actualValue, expectedValue, `Expected "${key}" to be "${expectedValue}" but got "${actualValue}"`)
    }
  }
}
