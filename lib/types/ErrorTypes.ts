import type { AChangeType } from '~/types/ChangeTypes'
import ChangeTypes from '~/types/ChangeTypes'

export const ADDED_ONE_TOO_FEW = 'ADDED_ONE_TOO_FEW' as const
export const ADDED_ONE_TOO_MANY = 'ADDED_ONE_TOO_MANY' as const
export const ADDED_INSTEAD_OF_MULTIPLIED = 'ADDED_INSTEAD_OF_MULTIPLIED' as const
export const MULTIPLIED_INSTEAD_OF_ADDED = 'MULTIPLIED_INSTEAD_OF_ADDED' as const
export const SUBTRACTED_INSTEAD_OF_ADDED = 'SUBTRACTED_INSTEAD_OF_ADDED' as const

export const ADDED_INSTEAD_OF_SUBTRACTED = 'ADDED_INSTEAD_OF_SUBTRACTED' as const
export const MULTIPLIED_INSTEAD_OF_SUBTRACTED = 'MULTIPLIED_INSTEAD_OF_SUBTRACTED' as const
export const SUBTRACTED_INSTEAD_OF_MULTIPLIED = 'SUBTRACTED_INSTEAD_OF_MULTIPLIED' as const
export const SUBTRACTED_ONE_TOO_MANY = 'SUBTRACTED_ONE_TOO_MANY' as const
export const SUBTRACTED_ONE_TOO_FEW = 'SUBTRACTED_ONE_TOO_FEW' as const

export const MULTIPLIED_ONE_TOO_MANY = 'MULTIPLIED_ONE_TOO_MANY' as const
export const MULTIPLIED_ONE_TOO_FEW = 'MULTIPLIED_ONE_TOO_FEW' as const

export const MultiplicationErrors = {
  ADDED_INSTEAD_OF_MULTIPLIED,
  SUBTRACTED_INSTEAD_OF_MULTIPLIED,
  MULTIPLIED_INSTEAD_OF_ADDED,
  MULTIPLIED_INSTEAD_OF_SUBTRACTED,
  MULTIPLIED_ONE_TOO_MANY,
  MULTIPLIED_ONE_TOO_FEW,
} as const

export const AdditionErrors = {
  ADDED_ONE_TOO_FEW,
  ADDED_ONE_TOO_MANY,
  SUBTRACTED_INSTEAD_OF_ADDED,
} as const
export const isAdditionError = (errorType: AMistakeType) => Object.values(AdditionErrors).includes(errorType as any)
export const SubtractionErrors = {
  SUBTRACTED_ONE_TOO_FEW,
  SUBTRACTED_ONE_TOO_MANY,
  ADDED_INSTEAD_OF_SUBTRACTED,
} as const

export const UNKNOWN = 'UNKNOWN' as const
export const NO_CHANGE = 'NO_CHANGE' as const
export const MistakeTypes = {
  ...ChangeTypes, // Also include the ChangeTypes
  ...MultiplicationErrors,
  ...AdditionErrors,
  ...SubtractionErrors,
  UNKNOWN,
  NO_CHANGE,
} as const
export type AMistakeType = typeof MistakeTypes[keyof typeof MistakeTypes] | AChangeType | null
export default MistakeTypes

export const convertAdditionToSubtractionErrorType = (errorType: AMistakeType) => {
  switch (errorType) {
    case ADDED_ONE_TOO_FEW: return SUBTRACTED_ONE_TOO_MANY
    case ADDED_ONE_TOO_MANY: return SUBTRACTED_ONE_TOO_FEW
    case ADDED_INSTEAD_OF_MULTIPLIED: return SUBTRACTED_INSTEAD_OF_MULTIPLIED
    case MULTIPLIED_INSTEAD_OF_ADDED: return MULTIPLIED_INSTEAD_OF_SUBTRACTED
    case SUBTRACTED_INSTEAD_OF_ADDED: return ADDED_INSTEAD_OF_SUBTRACTED
    case null: return null
    default: {
      // Kind of a hacky way to convert the errorType from addition to subtraction.
      const newErrorType = errorType.replace('SUBTRACTED', 's0').replace('SUBTRACT', 's1').replace('ADDED', 'a0').replace('ADD', 'a1')
        .replace('s0', 'ADDED')
        .replace('s1', 'ADD')
        .replace('a0', 'SUBTRACTED')
        .replace('a1', 'SUBTRACT') as AMistakeType
      return newErrorType
    }
  }
}
