import type { AChangeType } from '~/types/ChangeTypes'

// Shared constants
const ADDED_ONE_TOO_FEW = 'ADDED_ONE_TOO_FEW' as const
const ADDED_ONE_TOO_MANY = 'ADDED_ONE_TOO_MANY' as const
const ADDED_INSTEAD_OF_MULTIPLIED = 'ADDED_INSTEAD_OF_MULTIPLIED' as const
const MULTIPLIED_INSTEAD_OF_ADDED = 'MULTIPLIED_INSTEAD_OF_ADDED' as const
const SUBTRACTED_INSTEAD_OF_ADDED = 'SUBTRACTED_INSTEAD_OF_ADDED' as const
const ADDED_INSTEAD_OF_SUBTRACTED = 'ADDED_INSTEAD_OF_SUBTRACTED' as const
const MULTIPLIED_INSTEAD_OF_SUBTRACTED = 'MULTIPLIED_INSTEAD_OF_SUBTRACTED' as const
const SUBTRACTED_INSTEAD_OF_MULTIPLIED = 'SUBTRACTED_INSTEAD_OF_MULTIPLIED' as const
const SUBTRACTED_ONE_TOO_MANY = 'SUBTRACTED_ONE_TOO_MANY' as const
const SUBTRACTED_ONE_TOO_FEW = 'SUBTRACTED_ONE_TOO_FEW' as const
const MULTIPLIED_ONE_TOO_MANY = 'MULTIPLIED_ONE_TOO_MANY' as const
const MULTIPLIED_ONE_TOO_FEW = 'MULTIPLIED_ONE_TOO_FEW' as const

const UNKNOWN = 'UNKNOWN' as const
const NO_CHANGE = 'NO_CHANGE' as const

// Group mappings for mistake types
const groupMappings = {
  MultiplicationRules: [
    ADDED_INSTEAD_OF_MULTIPLIED,
    SUBTRACTED_INSTEAD_OF_MULTIPLIED,
    MULTIPLIED_INSTEAD_OF_ADDED,
    MULTIPLIED_INSTEAD_OF_SUBTRACTED,
    MULTIPLIED_ONE_TOO_MANY,
    MULTIPLIED_ONE_TOO_FEW,
  ] as const,

  AdditionRules: [
    ADDED_ONE_TOO_FEW,
    ADDED_ONE_TOO_MANY,
    SUBTRACTED_INSTEAD_OF_ADDED,
  ] as const,

  SubtractionRules: [
    SUBTRACTED_ONE_TOO_FEW,
    SUBTRACTED_ONE_TOO_MANY,
    ADDED_INSTEAD_OF_SUBTRACTED,
  ] as const,

  UNKNOWN: [UNKNOWN] as const,
  NO_CHANGE: [NO_CHANGE] as const,
}

// Dynamically create MistakeTypes from groupMappings
export const MistakeTypes = {
  ...Object.fromEntries(
    Object.values(groupMappings).flatMap(rules =>
      Array.from(rules).map(rule => [rule, rule]),
    ),
  ),
} as const

export type AMistakeType = typeof MistakeTypes[keyof typeof MistakeTypes] | AChangeType | null
export type MistakeTypeGroup = keyof typeof groupMappings

// Utility function to check if an error is an AdditionError
export const isAdditionError = (errorType: AMistakeType): boolean =>
  Object.values(groupMappings.AdditionRules).includes(errorType as any)

export const getErrorTypeGroups = (changeType_: AMistakeType | string): MistakeTypeGroup[] => {
  const changeType: AChangeType = changeType_?.includes('__CASE_')
    ? changeType_.split('__CASE_')[0] as AChangeType
    : changeType_ as AChangeType

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(groupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag as MistakeTypeGroup)

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
  return [...firstPass, ...secondPass] as MistakeTypeGroup[]
}

// Function to convert addition errors to subtraction errors
export const convertAdditionToSubtractionErrorType = (errorType: AMistakeType): AMistakeType => {
  switch (errorType) {
    case ADDED_ONE_TOO_FEW: return SUBTRACTED_ONE_TOO_MANY
    case ADDED_ONE_TOO_MANY: return SUBTRACTED_ONE_TOO_FEW
    case ADDED_INSTEAD_OF_MULTIPLIED: return SUBTRACTED_INSTEAD_OF_MULTIPLIED
    case MULTIPLIED_INSTEAD_OF_ADDED: return MULTIPLIED_INSTEAD_OF_SUBTRACTED
    case SUBTRACTED_INSTEAD_OF_ADDED: return ADDED_INSTEAD_OF_SUBTRACTED
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

export default MistakeTypes
