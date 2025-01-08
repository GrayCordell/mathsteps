import type { AChangeType, AChangeTypeGroup, CHANGE_TYPE_GROUPS } from '~/types/changeType/ChangeTypes'
import { changeGroupMappings, mapMistakeTypeToChangeTypeError, mapWordsToGroups, MISTAKE_ONLY } from '~/types/changeType/ChangeTypes'
import { cleanString } from '~/util/stringUtils'

export const getRootChangeType = <T extends { includes: any, split?: any } | null>(changeType_: T) =>
  (changeType_ && changeType_?.includes('__CASE_'))
    ? changeType_.split('__CASE_')[0] as T
    : changeType_

export const isMistakeTypeOnly = (change: AChangeType): boolean => {
  if (change === null)
    return true
  const changeOrMistakeType = getRootChangeType(change)
  return Object.values(MISTAKE_ONLY).flat().includes(changeOrMistakeType as any) // mistakeOnlyGroupMappings does not also contain mistake changetypes.
}

export const convertMistakeOnlyTypeToItsChangeType = (mistakeType_: AChangeType, isMistake?: boolean): AChangeType | null => {
  const mistakeType = getRootChangeType(mistakeType_)
  if (isMistake || !isMistakeTypeOnly(mistakeType))
    return mistakeType
  return mapMistakeTypeToChangeTypeError[mistakeType as keyof typeof mapMistakeTypeToChangeTypeError] || null
}

export const getChangeTypeGroups = (changeType_: AChangeType): AChangeTypeGroup[] => {
  const changeType = getRootChangeType(changeType_)

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(changeGroupMappings)
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


export function getEveryChangeIdApplicable(changeTypeOrMistakeType_: AChangeType): (AChangeTypeGroup | AChangeType)[] {
  const changeTypeOrMistakeType = getRootChangeType(changeTypeOrMistakeType_)
  const isMistake = isMistakeTypeOnly(changeTypeOrMistakeType)
  const changeTypeOnly = convertMistakeOnlyTypeToItsChangeType(changeTypeOrMistakeType, isMistake) || changeTypeOrMistakeType

  return [changeTypeOnly, ...getChangeTypeGroups(changeTypeOnly)].filter(Boolean)
}

export const isChangeTypeInGroup = (changeType: AChangeType, group: AChangeTypeGroup): boolean => getChangeTypeGroups(changeType).includes(group)
export const isSameRootChangeType = (rootChangeType: string | AChangeType, changeType: string | AChangeType): boolean => {
  // remove __CASE_1, __CASE_2, etc.
  const rootChangeTypeWithoutCase = rootChangeType.split('__CASE_')[0]
  const changeTypeWithoutCase = changeType.split('__CASE_')[0]
  return rootChangeTypeWithoutCase === changeTypeWithoutCase
}
export const doesChangeTypeEqual = (a: AChangeType, b: AChangeType): boolean => a === b || isSameRootChangeType(a, b)


export const OPERATORS = ['+', '-', '*', '/', '--', '+-'] as const
export type AOperator = typeof OPERATORS[number]

// Function to convert addition errors to subtraction errors
export const convertAdditionToSubtractionErrorType = (errorType: AChangeType): AChangeType => {
  switch (errorType) {
    case 'ADDED_ONE_TOO_FEW': return 'SUBTRACTED_ONE_TOO_MANY'
    case 'ADDED_ONE_TOO_MANY': return 'SUBTRACTED_ONE_TOO_FEW'
    case 'ADDED_INSTEAD_OF_MULTIPLIED': return 'SUBTRACTED_INSTEAD_OF_MULTIPLIED'
    case 'MULTIPLIED_INSTEAD_OF_ADDED': return 'MULTIPLIED_INSTEAD_OF_SUBTRACTED'
    case 'SUBTRACTED_INSTEAD_OF_ADDED': return 'ADDED_INSTEAD_OF_SUBTRACTED'
    default: {
    // Convert addition-related terms to their subtraction counterparts using replacements
      const newErrorType = errorType
        ?.replaceAll('SUBTRACTED', 's0')
        ?.replaceAll('SUBTRACT', 's1')
        ?.replaceAll('ADDED', 'a0')
        ?.replaceAll('ADD', 'a1')
        ?.replaceAll('s0', 'ADDED')
        ?.replaceAll('s1', 'ADD')
        ?.replaceAll('a0', 'SUBTRACTED')
        ?.replaceAll('a1', 'SUBTRACT')
      return newErrorType as AChangeType
    }
  }
}
export const changeTypeBasedOnOperatorMap: Record<AOperator, AChangeType> = {
  '+-': 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  '--': 'SIMPLIFY_ARITHMETIC__ADD',
  '+': 'SIMPLIFY_ARITHMETIC__ADD',
  '-': 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  '*': 'SIMPLIFY_ARITHMETIC__MULTIPLY',
  '/': 'SIMPLIFY_ARITHMETIC__DIVIDE',
}
export const reverseOp: Record<AOperator, AOperator> = {
  '+-': '+', // +- -> - so reverse: +
  '--': '-', // -- -> + so reverse: -
  '+': '-',
  '-': '+',
  '*': '/',
  '/': '*',
}
export const reverseOpForFlat: Record<AOperator, AOperator> = {
  '+-': '+', // +- -> - so reverse: +
  '--': '-', // -- -> + so reverse: -
  '+': '+-', // in flat - is +-
  '-': '+',
  '*': '/',
  '/': '*',
}
export const unflattenOp: Record<AOperator, AOperator> = {
  '+-': '-',
  '--': '+',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
}


export const isAnOp = (op: unknown): op is AOperator => typeof op !== 'string' ? false : OPERATORS.includes(op as AOperator)


/**
 * Get the change type (addition, subtraction, multiplication, etc.).
 * @param op The operator used in the operation.
 * Operator can be '+', '-', '*', '/', '--', '+-'
 */
export const getReverseOp = (op: string | AOperator): AOperator => {
  return reverseOp[cleanString(op) as AOperator]
}

// - -> +-
export const getReverseOpForFlat = (op: string | AOperator): AOperator => reverseOpForFlat[cleanString(op) as AOperator]


/**
 * Get the change type (addition, subtraction, multiplication, etc.).
 * @param op
 * Operator can be '+', '-', '*', '/', '--', '+-'
 */
export const getSimplifyChangeTypeByOp = (op: AOperator): AChangeType => changeTypeBasedOnOperatorMap[cleanString(op) as AOperator]
export const changeTypeIsInGroup = (change: AChangeType, group: typeof CHANGE_TYPE_GROUPS[number]): boolean => {
  const changeOrMistakeType = getRootChangeType(change)
  return Object.values(changeGroupMappings[group as keyof typeof changeGroupMappings] || []).includes(changeOrMistakeType as any) // MistakeGroupMappings also contain ChangeTypes too. So, we can use it for both
}
export const isAnAdditionChangeType = (change: AChangeType): boolean => changeTypeIsInGroup(change, 'AdditionRules')
// export const isSubtraction = (change: AChangeType): boolean => changeTypeIsInGroup(change, 'SubtractionRules')
// export const isMultiplication = (change: AChangeType): boolean => changeTypeIsInGroup(change, 'MultiplicationRules')
// export const isDivision = (change: AChangeType): boolean => changeTypeIsInGroup(change, 'DivisionRules')

export const isOpEqual = (op1: AOperator | null, op2: AOperator | null): boolean => {
  if (!isAnOp(op1) || !isAnOp(op2))
    return false
  const op1Normal = unflattenOp?.[cleanString(op1) as AOperator]
  const op2Normal = unflattenOp?.[cleanString(op2) as AOperator]
  return op1Normal === op2Normal
}


export const isRemoveTermChangeType = (changeType: AChangeType | string): boolean => typeof changeType !== 'string' ? false : changeType.includes('REMOVE_TERM')
export const isAddTermChangeType = (changeType: AChangeType | string): boolean => typeof changeType !== 'string' ? false : changeType.includes('ADD_TERM')

export const hasARemoveTermChangeType = (changeTypes: AChangeType[]): boolean => changeTypes.some(isRemoveTermChangeType)
export const hasAnAddTermChangeType = (changeTypes: AChangeType[]): boolean => changeTypes.some(isAddTermChangeType)

export const getAllRemoveTermChangeTypes = (changeTypes: AChangeType[]): AChangeType[] => changeTypes.filter(isRemoveTermChangeType)
export const getAllAddTermChangeTypes = (changeTypes: AChangeType[]): AChangeType[] => changeTypes.filter(isAddTermChangeType)
