/**
 * @file declareChangeTypesHere.ts
 * @description Everything that needs to be updated when creating a new changeType or mistakeType should be in this file.
 */

// region CHANGE_TYPES
// region CHANGE_TYPES SHARED CONSTANTS
const SIMPLIFY_ARITHMETIC_MULTIPLY = 'SIMPLIFY_ARITHMETIC__MULTIPLY' as const
const KEMU_MULTIPLY_SQRTS = 'KEMU_MULTIPLY_SQRTS' as const
const KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT = 'KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT' as const
const KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE = 'KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE' as const
const KEMU_DIVIDE_POWERS_WITH_COMMON_BASE = 'KEMU_DIVIDE_POWERS_WITH_COMMON_BASE' as const
const KEMU_REMOVE_DOUBLE_FRACTION = 'KEMU_REMOVE_DOUBLE_FRACTION' as const
const KEMU_POWER_FACTORS = 'KEMU_POWER_FACTORS' as const
const KEMU_POWER_TO_MINUS_ONE = 'KEMU_POWER_TO_MINUS_ONE' as const
const KEMU_POWER_TO_NEGATIVE_EXPONENT = 'KEMU_POWER_TO_NEGATIVE_EXPONENT' as const
const KEMU_ROOT_FROM_FRACTION = 'KEMU_ROOT_FROM_FRACTION' as const
const MULTIPLY_FRACTIONS = 'MULTIPLY_FRACTIONS' as const
const SIMPLIFY_ARITHMETIC__ADD = 'SIMPLIFY_ARITHMETIC__ADD' as const
const SIMPLIFY_ARITHMETIC__SUBTRACT = 'SIMPLIFY_ARITHMETIC__SUBTRACT' as const
const PERCENTS_ADD = 'PERCENTS_ADD' as const
const PERCENTS_SUB = 'PERCENTS_SUB' as const
const PERCENTS_CONVERT_TO_FRACTION = 'PERCENTS_CONVERT_TO_FRACTION' as const
const KEMU_SHORT_MULTIPLICATION_AB2_ADD = 'KEMU_SHORT_MULTIPLICATION_AB2_ADD' as const
const KEMU_SHORT_MULTIPLICATION_AB3_ADD = 'KEMU_SHORT_MULTIPLICATION_AB3_ADD' as const
const KEMU_SHORT_MULTIPLICATION_ABN_ADD = 'KEMU_SHORT_MULTIPLICATION_ABN_ADD' as const
const KEMU_SHORT_MULTIPLICATION_AB2_SUB = 'KEMU_SHORT_MULTIPLICATION_AB2_SUB' as const
const KEMU_SHORT_MULTIPLICATION_AB3_SUB = 'KEMU_SHORT_MULTIPLICATION_AB3_SUB' as const
const KEMU_SHORT_MULTIPLICATION_ABN_SUB = 'KEMU_SHORT_MULTIPLICATION_ABN_SUB' as const
const KEMU_DISTRIBUTE_MUL_OVER_ADD = 'KEMU_DISTRIBUTE_MUL_OVER_ADD' as const
const REDUCE_ZERO_NUMERATOR = 'REDUCE_ZERO_NUMERATOR' as const
// endregion CHANGE_TYPES SHARED CONSTANTS
// CHANGE_TYPES DECLARATIONS. (Placed in groups for metadata purposes)
export const changeGroupMappings = {
  SimplifyArithmetic: [
    'SIMPLIFY_ARITHMETIC',
    'SIMPLIFY_ARITHMETIC__ADD',
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
    SIMPLIFY_ARITHMETIC_MULTIPLY,
    'SIMPLIFY_ARITHMETIC__POWER',
    KEMU_DISTRIBUTE_MUL_OVER_ADD,
  ],

  AdditionRules: [
    SIMPLIFY_ARITHMETIC__ADD,
    KEMU_SHORT_MULTIPLICATION_AB2_ADD,
    KEMU_SHORT_MULTIPLICATION_AB3_ADD,
    KEMU_SHORT_MULTIPLICATION_ABN_ADD,
    PERCENTS_ADD,
  ],

  SubtractionRules: [
    SIMPLIFY_ARITHMETIC__SUBTRACT,
    KEMU_SHORT_MULTIPLICATION_AB2_SUB,
    KEMU_SHORT_MULTIPLICATION_AB3_SUB,
    KEMU_SHORT_MULTIPLICATION_ABN_SUB,
    PERCENTS_SUB,
  ],

  DivisionRules: [
    'DIVISION_BY_NEGATIVE_ONE',
    'DIVISION_BY_ONE',
    KEMU_DIVIDE_POWERS_WITH_COMMON_BASE,
    KEMU_REMOVE_DOUBLE_FRACTION,
    REDUCE_ZERO_NUMERATOR,
  ],

  MultiplicationRules: [
    KEMU_DISTRIBUTE_MUL_OVER_ADD,
    SIMPLIFY_ARITHMETIC_MULTIPLY,
    'MULTIPLY_BY_ZERO',
    MULTIPLY_FRACTIONS,
    'MULTIPLY_NTH_ROOTS',
    'DISTRIBUTE_NEGATIVE_ONE',
    KEMU_MULTIPLY_SQRTS,
    KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT,
    KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE,
    'KEMU_MULTIPLY_EXPONENTS',
    KEMU_SHORT_MULTIPLICATION_AB2_ADD,
    KEMU_SHORT_MULTIPLICATION_AB3_ADD,
    KEMU_SHORT_MULTIPLICATION_ABN_ADD,
    KEMU_SHORT_MULTIPLICATION_AB2_SUB,
    KEMU_SHORT_MULTIPLICATION_AB3_SUB,
    KEMU_SHORT_MULTIPLICATION_ABN_SUB,
  ],

  CoefficientSimplificationRules: [
    'REARRANGE_COEFF',
    'CANCEL_MINUSES',
    'CANCEL_TERMS',
    'KEMU_FACTOR_EXPRESSION_UNDER_ROOT',
  ],

  ExponentSimplificationRules: [
    'REDUCE_EXPONENT_BY_ZERO',
    'REMOVE_EXPONENT_BY_ONE',
    'REMOVE_EXPONENT_BASE_ONE',
    'REMOVE_EXPONENT_BASE_ZERO',
    KEMU_POWER_FACTORS,
    KEMU_POWER_TO_MINUS_ONE,
    KEMU_POWER_TO_NEGATIVE_EXPONENT,
  ],

  ExpressionSimplificationRules: [
    'REMOVE_ADDING_ZERO',
    'REMOVE_MULTIPLYING_BY_NEGATIVE_ONE',
    'REMOVE_MULTIPLYING_BY_ONE',
    'RESOLVE_DOUBLE_MINUS',
    'SIMPLIFY_SIGNS',
    'COLLECT_AND_COMBINE_LIKE_TERMS',
    'KEMU_REMOVE_UNNEDED_PARENTHESIS',
    'KEMU_ORIGINAL_EXPRESSION',
  ],

  AbsoluteValueRules: ['ABSOLUTE_VALUE'],
  UNKNOWN: ['UNKNOWN'],
  NO_CHANGE: ['NO_CHANGE'],

  FractionRules: [
    'ADD_FRACTIONS',
    'COMMON_DENOMINATOR',
    MULTIPLY_FRACTIONS,
    'SIMPLIFY_FRACTION',
    'KEMU_DECIMAL_TO_FRACTION',
    KEMU_ROOT_FROM_FRACTION,
    'KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR',
    'BREAK_UP_FRACTION',
    KEMU_REMOVE_DOUBLE_FRACTION,
    PERCENTS_CONVERT_TO_FRACTION,
    REDUCE_ZERO_NUMERATOR,
  ],

  TrigonometricRules: [
    'KEMU_PYTHAGOREAN_IDENTITY',
    'KEMU_EVEN_FUNCTION_OF_NEGATIVE',
    'KEMU_ODD_FUNCTION_OF_NEGATIVE',
    'KEMU_CONVERT_SIN_PER_COS_TO_TAN',
    'KEMU_CONVERT_COS_PER_SIN_TO_COT',
    'KEMU_CANCEL_INVERSE_FUNCTION',
    'KEMU_FUNCTION_VALUE',
  ],

  LogarithmRules: [
    'KEMU_LOG_XY_FROM_ONE',
    'KEMU_LOG_XY_FROM_BASE',
    'KEMU_LOG_XY_FROM_POWER',
  ],

  PercentageRules: [
    PERCENTS_ADD,
    PERCENTS_SUB,
    PERCENTS_CONVERT_TO_FRACTION,
  ],

  RootAndPowerRules: [
    KEMU_MULTIPLY_SQRTS,
    KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT,
    KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE,
    KEMU_DIVIDE_POWERS_WITH_COMMON_BASE,
    'KEMU_CONVERT_ROOT_TO_POWER',
    'KEMU_CONVERT_POWER_TO_ROOT',
    KEMU_POWER_FACTORS,
    'KEMU_POWER_FRACTION',
    'KEMU_POWER_SQRT',
    'KEMU_SQRT_FROM_ZERO',
    'KEMU_SQRT_FROM_ONE',
    'KEMU_SQRT_FROM_POW',
    'KEMU_SQRT_FROM_CONST',
    'KEMU_ROOT_FROM_CONST',
    KEMU_ROOT_FROM_FRACTION,
    KEMU_POWER_TO_MINUS_ONE,
    KEMU_POWER_TO_NEGATIVE_EXPONENT,
  ],
  OrderOfOperations: [],
} as const satisfies Record<Readonly<string>, Readonly<string>[]>
export type AChangeTypeGroup = keyof typeof changeGroupMappings // ex. 'SimplifyArithmetic'
// endregion
// region MISTAKE_TYPES

// region MISTAKE_TYPES SHARED CONSTANTS
const PEMDAS__ADD_INSTEAD_OF_MULTIPLY = 'PEMDAS__ADD_INSTEAD_OF_MULTIPLY' as const
// endregion

export const mistakeOnlyGroupMappings = {
  MultiplicationRules: ['ADDED_INSTEAD_OF_MULTIPLIED', 'SUBTRACTED_INSTEAD_OF_MULTIPLIED', 'MULTIPLIED_INSTEAD_OF_ADDED', 'MULTIPLIED_INSTEAD_OF_SUBTRACTED', 'MULTIPLIED_ONE_TOO_MANY', 'MULTIPLIED_ONE_TOO_FEW', PEMDAS__ADD_INSTEAD_OF_MULTIPLY],
  AdditionRules: ['ADDED_ONE_TOO_FEW', 'ADDED_ONE_TOO_MANY', 'SUBTRACTED_INSTEAD_OF_ADDED'],
  SubtractionRules: ['SUBTRACTED_ONE_TOO_FEW', 'SUBTRACTED_ONE_TOO_MANY', 'ADDED_INSTEAD_OF_SUBTRACTED'],
  UNKNOWN: ['UNKNOWN'],
  NO_CHANGE: ['NO_CHANGE'],
  SimplifyArithmetic: [],
  DivisionRules: [],
  CoefficientSimplificationRules: [],
  ExponentSimplificationRules: [],
  ExpressionSimplificationRules: [],
  AbsoluteValueRules: [],
  FractionRules: [],
  TrigonometricRules: [],
  LogarithmRules: [],
  PercentageRules: [],
  RootAndPowerRules: [],
  OrderOfOperations: [PEMDAS__ADD_INSTEAD_OF_MULTIPLY],
} as const satisfies Record<AChangeTypeGroup, Readonly<string>[]>

export const mapMistakeTypeToChangeTypeError = {
  SIMPLIFY_ARITHMETIC__ADD: ['ADDED_ONE_TOO_FEW', 'ADDED_ONE_TOO_MANY', 'SUBTRACTED_INSTEAD_OF_ADDED'],
  SIMPLIFY_ARITHMETIC__SUBTRACT: ['SUBTRACTED_ONE_TOO_FEW', 'SUBTRACTED_ONE_TOO_MANY', 'ADDED_INSTEAD_OF_SUBTRACTED'],
  SIMPLIFY_ARITHMETIC__MULTIPLY: ['ADDED_INSTEAD_OF_MULTIPLIED', 'SUBTRACTED_INSTEAD_OF_MULTIPLIED', 'MULTIPLIED_ONE_TOO_MANY', 'MULTIPLIED_ONE_TOO_FEW'],
} as const satisfies Record<Readonly<string>, Readonly<string[]>>

// endregion

export const mapWordsToGroups = {
  MULTIPLY: 'MultiplicationRules',
  MULTIPLIED: 'MultiplicationRules',
  MULTIPLICATION: 'MultiplicationRules',
  DIVIDE: 'DivisionRules',
  DIVIDED: 'DivisionRules',
  DIVISION: 'DivisionRules',
  ADD: 'AdditionRules',
  ADDITION: 'AdditionRules',
  SUBTRACT: 'SubtractionRules',
  SUBTRACTION: 'SubtractionRules',
  POWER: 'ExponentSimplificationRules',
  ROOT: 'RootAndPowerRules',
  FRACTION: 'FractionRules',
  FRACTIONS: 'FractionRules',
  COEFFICIENT: 'CoefficientSimplificationRules',
  ABSOLUTE_VALUE: 'AbsoluteValueRules',
  TRIGONOMETRIC: 'TrigonometricRules',
  LOG: 'LogarithmRules',
  PERCENT: 'PercentageRules',
} as const