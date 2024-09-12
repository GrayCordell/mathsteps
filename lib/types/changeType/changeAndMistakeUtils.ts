// function to determine the groups a changeType belongs to

import { changeGroupMappings, mapWordsToGroups, mistakeGroupMappings } from './declareChangeTypesHere'
import type { AMistakeType, AMistakeTypeGroup } from '~/types/changeType/ErrorTypes'
import type { AChangeType, AChangeTypeGroup } from '~/types/changeType/ChangeTypes'

// Utility function to check if an error is an AdditionError
export const isAdditionError = (errorType: AMistakeType): boolean =>
  Object.values(mistakeGroupMappings.AdditionRules).includes(errorType as any)

export const getErrorTypeGroups = (changeType_: AMistakeType | string): AMistakeTypeGroup[] => {
  const changeType: AChangeType = changeType_?.includes('__CASE_')
    ? changeType_.split('__CASE_')[0] as AChangeType
    : changeType_ as AChangeType

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(mistakeGroupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag as AMistakeTypeGroup)

  const secondPass = []
  if (!firstPass || firstPass.length === 0) {
    if (changeType.includes('MULTIPLY'))
      secondPass.push('MultiplicationRules')
    if (changeType.includes('DIVIDE'))
      secondPass.push('DivisionRules')
    if (changeType.includes('ADD') || changeType.includes('SUBTRACT'))
      secondPass.push('SimplifyArithmetic')
    if (changeType.includes('POWER'))
      secondPass.push('ExponentSimplificationRules')
    if (changeType.includes('ROOT'))
      secondPass.push('RootAndPowerRules')
    if (changeType.includes('FRACTION'))
      secondPass.push('FractionRules')
    if (changeType.includes('COEFFICIENT'))
      secondPass.push('CoefficientSimplificationRules')
    if (changeType.includes('ABSOLUTE_VALUE'))
      secondPass.push('AbsoluteValueRules')
    if (changeType.includes('TRIGONOMETRIC'))
      secondPass.push('TrigonometricRules')
    if (changeType.includes('LOG'))
      secondPass.push('LogarithmRules')
    if (changeType.includes('PERCENT'))
      secondPass.push('PercentageRules')
  }
  return [...firstPass, ...secondPass] as AMistakeTypeGroup[]
}

export const getChangeTypeGroups = (changeType_: AChangeType | string): AChangeTypeGroup[] => {
  const changeType: AChangeType = changeType_?.includes('__CASE_')
    ? changeType_.split('__CASE_')[0] as AChangeType
    : changeType_ as AChangeType

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(changeGroupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag).filter(Boolean)

  const secondPass = []
  if (!firstPass || firstPass.length === 0) {
    const changeTypeWords = changeType.split('_')
    const changeTypeGroups = changeTypeWords.map(word => mapWordsToGroups[word.toUpperCase() as keyof typeof mapWordsToGroups]).filter(Boolean)
    secondPass.push(...changeTypeGroups)
  }
  return [...firstPass, ...secondPass] as AChangeTypeGroup[]
}
export const isChangeTypeInGroup = (changeType: AChangeType, group: AChangeTypeGroup): boolean => getChangeTypeGroups(changeType).includes(group)
export function isSameRootChangeType(rootChangeType: string | AChangeType, changeType: string | AChangeType): boolean {
  // remove __CASE_1, __CASE_2, etc.
  const rootChangeTypeWithoutCase = rootChangeType.split('__CASE_')[0]
  const changeTypeWithoutCase = changeType.split('__CASE_')[0]
  return rootChangeTypeWithoutCase === changeTypeWithoutCase
}
export const doesChangeTypeEqual = (a: AChangeType, b: AChangeType): boolean => a === b || isSameRootChangeType(a, b)

// Function to convert addition errors to subtraction errors
export const convertAdditionToSubtractionErrorType = (errorType: AMistakeType): AMistakeType => {
  switch (errorType) {
    case 'ADDED_ONE_TOO_FEW': return 'SUBTRACTED_ONE_TOO_MANY'
    case 'ADDED_ONE_TOO_MANY': return 'SUBTRACTED_ONE_TOO_FEW'
    case 'ADDED_INSTEAD_OF_MULTIPLIED': return 'SUBTRACTED_INSTEAD_OF_MULTIPLIED'
    case 'MULTIPLIED_INSTEAD_OF_ADDED': return 'MULTIPLIED_INSTEAD_OF_SUBTRACTED'
    case 'SUBTRACTED_INSTEAD_OF_ADDED': return 'ADDED_INSTEAD_OF_SUBTRACTED'
    case null: return null
    default: {
    // Convert addition-related terms to their subtraction counterparts using replacements
      const newErrorType = errorType
        ?.replace('SUBTRACTED', 's0')
        ?.replace('SUBTRACT', 's1')
        ?.replace('ADDED', 'a0')
        ?.replace('ADD', 'a1')
        ?.replace('s0', 'ADDED')
        ?.replace('s1', 'ADD')
        ?.replace('a0', 'SUBTRACTED')
        ?.replace('a1', 'SUBTRACT') as AMistakeType
      return newErrorType
    }
  }
}
