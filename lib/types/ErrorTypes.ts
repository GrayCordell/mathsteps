import ChangeTypes from '~/types/ChangeTypes'

export const ADDED_ONE_TOO_FEW = 'ADDED_ONE_TOO_FEW' as const
export const ADDED_ONE_TOO_MANY = 'ADDED_ONE_TOO_MANY' as const
export const ADDED_INSTEAD_OF_MULTIPLIED = 'ADDED_INSTEAD_OF_MULTIPLIED' as const
export const MULTIPLIED_INSTEAD_OF_ADDED = 'MULTIPLIED_INSTEAD_OF_ADDED' as const
export const SUBTRACTED_INSTEAD_OF_ADDED = 'SUBTRACTED_INSTEAD_OF_ADDED' as const
export const MULTIPLIED_ONE_TOO_MANY = 'MULTIPLIED_ONE_TOO_MANY' as const
export const MULTIPLIED_ONE_TOO_FEW = 'MULTIPLIED_ONE_TOO_FEW' as const

export const MultiplicationErrors = {
  ADDED_INSTEAD_OF_MULTIPLIED,
  MULTIPLIED_INSTEAD_OF_ADDED,
  SUBTRACTED_INSTEAD_OF_ADDED,
  MULTIPLIED_ONE_TOO_MANY,
  MULTIPLIED_ONE_TOO_FEW,
}

export const AdditionErrors = {
  ADDED_ONE_TOO_FEW,
  ADDED_ONE_TOO_MANY,
  SUBTRACTED_INSTEAD_OF_ADDED,
}

export default {
  ...ChangeTypes,
  ...MultiplicationErrors,
  ...AdditionErrors,
} as const
