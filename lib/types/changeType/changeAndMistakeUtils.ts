// function to determine the groups a changeType belongs to

import type { AChangeType, AChangeTypeGroup, ChangeTypeGroups } from '~/types/changeType/ChangeTypes'
import type { AMistakeType, AMistakeTypeGroup, MistakeTypeGroups } from '~/types/changeType/ErrorTypes'
import { mistakeGroupMappings } from '~/types/changeType/ErrorTypes'
import { changeGroupMappings, mapMistakeTypeToChangeTypeError, mapWordsToGroups, mistakeOnlyGroupMappings } from './declareChangeTypesHere'

export const getRootChangeType = <T extends { includes: any, split?: any } | null>(changeType_: T) =>
  (changeType_ && changeType_?.includes('__CASE_'))
    ? changeType_.split('__CASE_')[0] as T
    : changeType_
export const getRootMistakeType = <T extends { includes: any, split?: any } | null>(changeType_: T) => getRootChangeType(changeType_)

export const getErrorTypeGroups = (changeType_: AMistakeType): AMistakeTypeGroup[] => {
  const changeType = getRootChangeType(changeType_)
  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(mistakeGroupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag as AMistakeTypeGroup)

  const secondPass = []
  if (firstPass.length === 0) {
    const changeTypeWords = changeType?.split('_') || []
    const changeTypeGroups = changeTypeWords.map(word => mapWordsToGroups[word.toUpperCase() as keyof typeof mapWordsToGroups]).filter(Boolean)
    secondPass.push(...changeTypeGroups)
  }
  return [...firstPass, ...secondPass] as AMistakeTypeGroup[]
}

export const getChangeTypeGroups = (changeType_: AChangeType): AChangeTypeGroup[] => {
  const changeType = getRootChangeType(changeType_)

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(changeGroupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag)
    .filter(Boolean)

  const secondPass = []
  if (firstPass.length === 0) {
    const changeTypeWords = changeType.split('_')
    const changeTypeGroups = changeTypeWords.map(word => mapWordsToGroups[word.toUpperCase() as keyof typeof mapWordsToGroups]).filter(Boolean)
    secondPass.push(...changeTypeGroups)
  }
  return [...firstPass, ...secondPass] as AChangeTypeGroup[]
}
export const convertMistakeTypeToItsChangeType = (mistakeType_: AMistakeType): AChangeType | null => {
  const mistakeType = getRootMistakeType(mistakeType_)

  if (mistakeType === null)
    return null
  for (const [changeType, mistakeTypes] of Object.entries(mapMistakeTypeToChangeTypeError)) { // @ts-expect-error ---
    if (mistakeTypes.includes(mistakeType))
      return changeType as AChangeType
  }
  return null
}

export const getEveryChangeIdApplicable = (changeTypeOrMistakeType_: AMistakeType | AChangeType): [AChangeType, ...typeof ChangeTypeGroups] | [] => {
  const changeTypeOrMistakeType = getRootMistakeType(changeTypeOrMistakeType_)
  const tmpChangeTypeOnly = convertMistakeTypeToItsChangeType(changeTypeOrMistakeType) || changeTypeOrMistakeType || null
  if (!tmpChangeTypeOnly)
    return []
  const changeTypeOnly: AChangeType = tmpChangeTypeOnly as AChangeType

  return [changeTypeOnly, ...getChangeTypeGroups(changeTypeOnly)]
}

export const isChangeTypeInGroup = (changeType: AChangeType, group: AChangeTypeGroup): boolean => getChangeTypeGroups(changeType).includes(group)
export const isSameRootChangeType = (rootChangeType: string | AChangeType, changeType: string | AChangeType): boolean => {
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

export const isInAGroup = (changeOrMistakeType_: AMistakeType | AChangeType, group: typeof MistakeTypeGroups[number]): boolean => {
  const changeOrMistakeType = getRootMistakeType(changeOrMistakeType_)
  return Object.values(mistakeGroupMappings[group]).includes(changeOrMistakeType as any) // MistakeGroupMappings also contain ChangeTypes too. So, we can use it for both
}

// Utility function to check if an error is an AdditionError
export const isAddition = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => isInAGroup(changeOrMistakeType_, 'AdditionRules')
export const isSubtraction = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => isInAGroup(changeOrMistakeType_, 'SubtractionRules')
export const isMultiplication = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => isInAGroup(changeOrMistakeType_, 'MultiplicationRules')
export const isDivision = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => isInAGroup(changeOrMistakeType_, 'DivisionRules')
export const isMistakeType = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => {
  const changeOrMistakeType = getRootMistakeType(changeOrMistakeType_)
  return Object.values(mistakeGroupMappings).flat().includes(changeOrMistakeType as any) // MistakeGroupMappings also contain ChangeTypes too. So, we can use it for both
}
export const isMistakeTypeOnly = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => {
  const changeOrMistakeType = getRootMistakeType(changeOrMistakeType_)
  return Object.values(mistakeOnlyGroupMappings).flat().includes(changeOrMistakeType as any) // mistakeOnlyGroupMappings does not also contain mistake changetypes.
}
export const isAChangeType = (changeOrMistakeType_: AMistakeType | AChangeType): boolean => {
  const changeOrMistakeType = getRootChangeType(changeOrMistakeType_)
  return Object.values(changeGroupMappings).flat().includes(changeOrMistakeType as any)
}
