/**
 * @file ChangeTypes.ts
 * @description Everything that needs to be updated when creating a new changeType or mistakeType should be in this file.
 * Check _SharedChange, ALL_CHANGE_TYPES, CHANGE_TYPE_GROUPS,changeGroupMappings, and mapWordsToGroups when adding changes. TODO make easier to add changes.(I tried once and it made typescript slow.)
 */


const _SHARED_EQUATION_AND_MULTIPLY = {
  EQ_CROSS_MULTIPLY: 'EQ_CROSS_MULTIPLY',
} as const

// Define all change types in a const array. If the new ChangeType is in multiple places, then add it to the shared object here. (this is just for easier tracking)
const _SHARED_CHANGE = {
  SIMPLIFY_ARITHMETIC_MULTIPLY: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
  SIMPLIFY_ARITHMETIC__DIVIDE: 'SIMPLIFY_ARITHMETIC__DIVIDE', // <-- THIS IS A UNIQUE CASE NOT USED IN THE RULES ENGINE. Its not actually used in a rule like the other SIMPLIFY_ARITHMETIC__* types
  SIMPLIFY_ARITHMETIC__ADD: 'SIMPLIFY_ARITHMETIC__ADD',
  SIMPLIFY_ARITHMETIC__SUBTRACT: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  KEMU_MULTIPLY_SQRTS: 'KEMU_MULTIPLY_SQRTS',
  KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT: 'KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT',
  KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE: 'KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE',
  KEMU_DIVIDE_POWERS_WITH_COMMON_BASE: 'KEMU_DIVIDE_POWERS_WITH_COMMON_BASE',
  KEMU_REMOVE_DOUBLE_FRACTION: 'KEMU_REMOVE_DOUBLE_FRACTION',
  KEMU_POWER_FACTORS: 'KEMU_POWER_FACTORS',
  KEMU_POWER_TO_MINUS_ONE: 'KEMU_POWER_TO_MINUS_ONE',
  KEMU_POWER_TO_NEGATIVE_EXPONENT: 'KEMU_POWER_TO_NEGATIVE_EXPONENT',
  KEMU_ROOT_FROM_FRACTION: 'KEMU_ROOT_FROM_FRACTION',
  MULTIPLY_FRACTIONS: 'MULTIPLY_FRACTIONS',
  PERCENTS_ADD: 'PERCENTS_ADD',
  PERCENTS_SUB: 'PERCENTS_SUB',
  PERCENTS_CONVERT_TO_FRACTION: 'PERCENTS_CONVERT_TO_FRACTION',
  KEMU_SHORT_MULTIPLICATION_AB2_ADD: 'KEMU_SHORT_MULTIPLICATION_AB2_ADD',
  KEMU_SHORT_MULTIPLICATION_AB3_ADD: 'KEMU_SHORT_MULTIPLICATION_AB3_ADD',
  KEMU_SHORT_MULTIPLICATION_ABN_ADD: 'KEMU_SHORT_MULTIPLICATION_ABN_ADD',
  KEMU_SHORT_MULTIPLICATION_AB2_SUB: 'KEMU_SHORT_MULTIPLICATION_AB2_SUB',
  KEMU_SHORT_MULTIPLICATION_AB3_SUB: 'KEMU_SHORT_MULTIPLICATION_AB3_SUB',
  KEMU_SHORT_MULTIPLICATION_ABN_SUB: 'KEMU_SHORT_MULTIPLICATION_ABN_SUB',
  KEMU_DISTRIBUTE_MUL_OVER_ADD: 'KEMU_DISTRIBUTE_MUL_OVER_ADD',
  REDUCE_ZERO_NUMERATOR: 'REDUCE_ZERO_NUMERATOR',
  CANCEL_TERMS: 'CANCEL_TERMS',
} as const
const _SHARED_MISTAKE = {
  PEMDAS__ADD_INSTEAD_OF_MULTIPLY: 'PEMDAS__ADD_INSTEAD_OF_MULTIPLY',
} as const

export const MISTAKE_ONLY = {
  ..._SHARED_MISTAKE,
  PEMDAS__ADD_INSTEAD_OF_MULTIPLY: 'PEMDAS__ADD_INSTEAD_OF_MULTIPLY',
  ADDED_INSTEAD_OF_MULTIPLIED: 'ADDED_INSTEAD_OF_MULTIPLIED',
  SUBTRACTED_INSTEAD_OF_MULTIPLIED: 'SUBTRACTED_INSTEAD_OF_MULTIPLIED',
  MULTIPLIED_INSTEAD_OF_ADDED: 'MULTIPLIED_INSTEAD_OF_ADDED',
  MULTIPLIED_INSTEAD_OF_SUBTRACTED: 'MULTIPLIED_INSTEAD_OF_SUBTRACTED',
  MULTIPLIED_ONE_TOO_MANY: 'MULTIPLIED_ONE_TOO_MANY',
  MULTIPLIED_ONE_TOO_FEW: 'MULTIPLIED_ONE_TOO_FEW',
  ADDED_ONE_TOO_FEW: 'ADDED_ONE_TOO_FEW',
  ADDED_ONE_TOO_MANY: 'ADDED_ONE_TOO_MANY',
  SUBTRACTED_ONE_TOO_FEW: 'SUBTRACTED_ONE_TOO_FEW',
  SUBTRACTED_ONE_TOO_MANY: 'SUBTRACTED_ONE_TOO_MANY',
  UNKNOWN: 'UNKNOWN',
  NO_CHANGE: 'NO_CHANGE',
  SUBTRACTED_INSTEAD_OF_ADDED: 'SUBTRACTED_INSTEAD_OF_ADDED',
  ADDED_INSTEAD_OF_SUBTRACTED: 'ADDED_INSTEAD_OF_SUBTRACTED',
} as const


export const EQUATION_ADD_AND_REMOVE_TERMS = [
  'EQ_REMOVE_TERM', // equations only. (not expressions)
  'EQ_ADD_TERM', // equations only.
  'EQ_ADD_TERM_BY_ADDITION', // equations only.
  'EQ_ADD_TERM_BY_SUBTRACTION', // equations only.
  'EQ_ADD_TERM_BY_MULTIPLICATION', // equations only.
  'EQ_ADD_TERM_BY_DIVISION', // equations only.
  'EQ_REMOVE_TERM_BY_ADDITION', // equations only.
  'EQ_REMOVE_TERM_BY_SUBTRACTION', // equations only.
  'EQ_REMOVE_TERM_BY_MULTIPLICATION', // equations only.
  'EQ_REMOVE_TERM_BY_DIVISION', // equations only.
] as const


export type AMistakeTypeOnly = typeof MISTAKE_ONLY[keyof typeof MISTAKE_ONLY]
// No mistake types
export const CHANGE_TYPE_ONLY = [
  ...Object.values(_SHARED_EQUATION_AND_MULTIPLY),
  ...Object.values(_SHARED_CHANGE),
  ...Object.values(EQUATION_ADD_AND_REMOVE_TERMS),
  'SIMPLIFY_ARITHMETIC__POWER',
  'DIVISION_BY_NEGATIVE_ONE',
  'DIVISION_BY_ONE',
  'MULTIPLY_BY_ZERO',
  'MULTIPLY_NTH_ROOTS',
  'DISTRIBUTE_NEGATIVE_ONE',
  'KEMU_MULTIPLY_EXPONENTS',
  'REARRANGE_COEFF',
  'CANCEL_MINUSES',
  'KEMU_FACTOR_EXPRESSION_UNDER_ROOT',
  'REDUCE_EXPONENT_BY_ZERO',
  'REMOVE_EXPONENT_BY_ONE',
  'REMOVE_EXPONENT_BASE_ONE',
  'REMOVE_EXPONENT_BASE_ZERO',
  'REMOVE_ADDING_ZERO',
  'REMOVE_MULTIPLYING_BY_NEGATIVE_ONE',
  'REMOVE_MULTIPLYING_BY_ONE',
  'RESOLVE_DOUBLE_MINUS',
  'SIMPLIFY_SIGNS',
  'COLLECT_AND_COMBINE_LIKE_TERMS',
  'KEMU_REMOVE_UNNEDED_PARENTHESIS',
  'KEMU_ORIGINAL_EXPRESSION',
  'ABSOLUTE_VALUE',
  'UNKNOWN',
  'NO_CHANGE',
  'ADD_FRACTIONS',
  'COMMON_DENOMINATOR',
  // 'SIMPLIFY_FRACTION', UNUSED? Removed
  'KEMU_DECIMAL_TO_FRACTION',
  'KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR',
  'BREAK_UP_FRACTION',
  'KEMU_PYTHAGOREAN_IDENTITY',
  'KEMU_EVEN_FUNCTION_OF_NEGATIVE',
  'KEMU_ODD_FUNCTION_OF_NEGATIVE',
  'KEMU_CONVERT_SIN_PER_COS_TO_TAN',
  'KEMU_CONVERT_COS_PER_SIN_TO_COT',
  'KEMU_CANCEL_INVERSE_FUNCTION',
  'KEMU_FUNCTION_VALUE',
  'KEMU_LOG_XY_FROM_ONE',
  'KEMU_LOG_XY_FROM_BASE',
  'KEMU_LOG_XY_FROM_POWER',
  'KEMU_CONVERT_ROOT_TO_POWER',
  'KEMU_CONVERT_POWER_TO_ROOT',
  'KEMU_POWER_FRACTION',
  'KEMU_POWER_SQRT',
  'KEMU_SQRT_FROM_ZERO',
  'KEMU_SQRT_FROM_ONE',
  'KEMU_SQRT_FROM_POW',
  'KEMU_SQRT_FROM_CONST',
  'KEMU_ROOT_FROM_CONST',
  'EQ_SWAP_SIDES', // equations only.

  // 'EQ_CROSS_MULTIPLY',  // equations only. // now placed in _SHARED_EQUATION_AND_MULTIPLY
] as const
export type AChangeTypeOnly = typeof CHANGE_TYPE_ONLY[number]
export const ALL_CHANGE_TYPES = [
  ...Object.values(_SHARED_EQUATION_AND_MULTIPLY),
  ...Object.values(_SHARED_CHANGE),
  ...Object.values(MISTAKE_ONLY),
  ...CHANGE_TYPE_ONLY,
] as const
export type AChangeTypeCore = typeof ALL_CHANGE_TYPES[number] // ex. 'SIMPLIFY_ARITHMETIC__OP'
export type AChangeTypeWithCase = `${AChangeTypeCore}__CASE_${number}` // ex. 'SIMPLIFY_ARITHMETIC__OP__CASE_1'
export type AChangeType = AChangeTypeCore | AChangeTypeWithCase// ex. 'SIMPLIFY_ARITHMETIC__OP' | 'SIMPLIFY_ARITHMETIC__OP__CASE_1'
export const ChangeTypes: { [K in AChangeTypeCore]: K } = Object.fromEntries(ALL_CHANGE_TYPES.map(k => [k, k])) as { [K in AChangeTypeCore]: K }
export const CHANGE_TYPE_GROUPS = [
  'SimplifyArithmetic',
  'AdditionRules',
  'SubtractionRules',
  'DivisionRules',
  'MultiplicationRules',
  'CoefficientSimplificationRules',
  'ExponentSimplificationRules',
  'ExpressionSimplificationRules',
  'AbsoluteValueRules',
  'FractionRules',
  'TrigonometricRules',
  'LogarithmRules',
  'PercentageRules',
  'RootAndPowerRules',
  'OrderOfOperations',
  'UNKNOWN',
  'NO_CHANGE',
  'EquationRules',
  'MistakeWrongOperationRules',
] as const
export type AChangeTypeGroup = typeof CHANGE_TYPE_GROUPS[number]
export const changeGroupMappings: Record<AChangeTypeGroup, AChangeTypeCore[]> = {
  SimplifyArithmetic: [
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC__ADD,
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC__DIVIDE, // <-- THIS IS A UNIQUE CASE NOT USED IN THE RULES ENGINE. Its not actually used in a rule like the other SIMPLIFY_ARITHMETIC__* types
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC_MULTIPLY,
    'SIMPLIFY_ARITHMETIC__POWER',
    _SHARED_CHANGE.KEMU_DISTRIBUTE_MUL_OVER_ADD,
    // Mistakes
    ...[MISTAKE_ONLY.ADDED_INSTEAD_OF_MULTIPLIED, MISTAKE_ONLY.SUBTRACTED_INSTEAD_OF_MULTIPLIED, MISTAKE_ONLY.MULTIPLIED_INSTEAD_OF_ADDED, MISTAKE_ONLY.MULTIPLIED_INSTEAD_OF_SUBTRACTED, MISTAKE_ONLY.MULTIPLIED_ONE_TOO_MANY, MISTAKE_ONLY.MULTIPLIED_ONE_TOO_FEW, _SHARED_MISTAKE.PEMDAS__ADD_INSTEAD_OF_MULTIPLY],
  ],

  MistakeWrongOperationRules: [
    ...[MISTAKE_ONLY.SUBTRACTED_INSTEAD_OF_ADDED, MISTAKE_ONLY.ADDED_INSTEAD_OF_MULTIPLIED, MISTAKE_ONLY.SUBTRACTED_INSTEAD_OF_MULTIPLIED, MISTAKE_ONLY.MULTIPLIED_INSTEAD_OF_ADDED, MISTAKE_ONLY.MULTIPLIED_INSTEAD_OF_SUBTRACTED, MISTAKE_ONLY.MULTIPLIED_ONE_TOO_MANY, MISTAKE_ONLY.MULTIPLIED_ONE_TOO_FEW, _SHARED_MISTAKE.PEMDAS__ADD_INSTEAD_OF_MULTIPLY],
  ],


  AdditionRules: [
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC__ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB2_ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB3_ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_ABN_ADD,
    _SHARED_CHANGE.PERCENTS_ADD,
    // Mistakes
    ...[MISTAKE_ONLY.ADDED_ONE_TOO_FEW, MISTAKE_ONLY.ADDED_ONE_TOO_MANY, MISTAKE_ONLY.SUBTRACTED_INSTEAD_OF_ADDED],
  ],

  SubtractionRules: [
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC__SUBTRACT,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB2_SUB,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB3_SUB,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_ABN_SUB,
    _SHARED_CHANGE.PERCENTS_SUB,
    // Mistakes
    ...[MISTAKE_ONLY.SUBTRACTED_ONE_TOO_FEW, MISTAKE_ONLY.SUBTRACTED_ONE_TOO_MANY, MISTAKE_ONLY.ADDED_INSTEAD_OF_SUBTRACTED],
  ],

  DivisionRules: [
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC__DIVIDE, // <-- THIS IS A UNIQUE CASE NOT USED IN THE RULES ENGINE. Its not actually used in a rule like the other SIMPLIFY_ARITHMETIC__* types
    'DIVISION_BY_NEGATIVE_ONE',
    'DIVISION_BY_ONE',
    _SHARED_CHANGE.KEMU_DIVIDE_POWERS_WITH_COMMON_BASE,
    _SHARED_CHANGE.KEMU_REMOVE_DOUBLE_FRACTION,
    _SHARED_CHANGE.REDUCE_ZERO_NUMERATOR,
    _SHARED_CHANGE.CANCEL_TERMS,
  ],

  MultiplicationRules: [
    _SHARED_CHANGE.KEMU_DISTRIBUTE_MUL_OVER_ADD,
    _SHARED_CHANGE.SIMPLIFY_ARITHMETIC_MULTIPLY,
    'MULTIPLY_BY_ZERO',
    _SHARED_CHANGE.MULTIPLY_FRACTIONS,
    'MULTIPLY_NTH_ROOTS',
    'DISTRIBUTE_NEGATIVE_ONE',
    _SHARED_CHANGE.KEMU_MULTIPLY_SQRTS,
    _SHARED_CHANGE.KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT,
    _SHARED_CHANGE.KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE,
    'KEMU_MULTIPLY_EXPONENTS',
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB2_ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB3_ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_ABN_ADD,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB2_SUB,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_AB3_SUB,
    _SHARED_CHANGE.KEMU_SHORT_MULTIPLICATION_ABN_SUB,
    _SHARED_EQUATION_AND_MULTIPLY.EQ_CROSS_MULTIPLY,
  ],

  CoefficientSimplificationRules: [
    'REARRANGE_COEFF',
    'CANCEL_MINUSES',
    _SHARED_CHANGE.CANCEL_TERMS,
    'KEMU_FACTOR_EXPRESSION_UNDER_ROOT',
  ],

  ExponentSimplificationRules: [
    'REDUCE_EXPONENT_BY_ZERO',
    'REMOVE_EXPONENT_BY_ONE',
    'REMOVE_EXPONENT_BASE_ONE',
    'REMOVE_EXPONENT_BASE_ZERO',
    _SHARED_CHANGE.KEMU_POWER_FACTORS,
    _SHARED_CHANGE.KEMU_POWER_TO_MINUS_ONE,
    _SHARED_CHANGE.KEMU_POWER_TO_NEGATIVE_EXPONENT,
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
    _SHARED_CHANGE.MULTIPLY_FRACTIONS,
    // 'SIMPLIFY_FRACTION', UNUSED? Removed
    'KEMU_DECIMAL_TO_FRACTION',
    _SHARED_CHANGE.KEMU_ROOT_FROM_FRACTION,
    'KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR',
    'BREAK_UP_FRACTION',
    _SHARED_CHANGE.KEMU_REMOVE_DOUBLE_FRACTION,
    _SHARED_CHANGE.PERCENTS_CONVERT_TO_FRACTION,
    _SHARED_CHANGE.REDUCE_ZERO_NUMERATOR,
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
    _SHARED_CHANGE.PERCENTS_ADD,
    _SHARED_CHANGE.PERCENTS_SUB,
    _SHARED_CHANGE.PERCENTS_CONVERT_TO_FRACTION,
  ],

  RootAndPowerRules: [
    _SHARED_CHANGE.KEMU_MULTIPLY_SQRTS,
    _SHARED_CHANGE.KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT,
    _SHARED_CHANGE.KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE,
    _SHARED_CHANGE.KEMU_DIVIDE_POWERS_WITH_COMMON_BASE,
    'KEMU_CONVERT_ROOT_TO_POWER',
    'KEMU_CONVERT_POWER_TO_ROOT',
    _SHARED_CHANGE.KEMU_POWER_FACTORS,
    'KEMU_POWER_FRACTION',
    'KEMU_POWER_SQRT',
    'KEMU_SQRT_FROM_ZERO',
    'KEMU_SQRT_FROM_ONE',
    'KEMU_SQRT_FROM_POW',
    'KEMU_SQRT_FROM_CONST',
    'KEMU_ROOT_FROM_CONST',
    _SHARED_CHANGE.KEMU_ROOT_FROM_FRACTION,
    _SHARED_CHANGE.KEMU_POWER_TO_MINUS_ONE,
    _SHARED_CHANGE.KEMU_POWER_TO_NEGATIVE_EXPONENT,
  ],
  OrderOfOperations: [_SHARED_MISTAKE.PEMDAS__ADD_INSTEAD_OF_MULTIPLY],
  EquationRules: [
    'EQ_SWAP_SIDES',
    'EQ_REMOVE_TERM',
    'EQ_ADD_TERM',
    _SHARED_EQUATION_AND_MULTIPLY.EQ_CROSS_MULTIPLY,
  ],
} as const

// Map words to groups without
export const mapWordsToGroups: Record<string, AChangeTypeGroup> = {
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


export const mapMistakeTypeToChangeTypeError: Record<AMistakeTypeOnly, AChangeTypeOnly | null> = {
  PEMDAS__ADD_INSTEAD_OF_MULTIPLY: null,
  UNKNOWN: null,
  NO_CHANGE: null,
  ADDED_INSTEAD_OF_MULTIPLIED: ChangeTypes.SIMPLIFY_ARITHMETIC__MULTIPLY,
  SUBTRACTED_INSTEAD_OF_MULTIPLIED: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
  MULTIPLIED_INSTEAD_OF_ADDED: 'SIMPLIFY_ARITHMETIC__ADD',
  MULTIPLIED_INSTEAD_OF_SUBTRACTED: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  MULTIPLIED_ONE_TOO_MANY: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
  MULTIPLIED_ONE_TOO_FEW: 'SIMPLIFY_ARITHMETIC__MULTIPLY',
  ADDED_ONE_TOO_FEW: 'SIMPLIFY_ARITHMETIC__ADD',
  ADDED_ONE_TOO_MANY: 'SIMPLIFY_ARITHMETIC__ADD',
  SUBTRACTED_ONE_TOO_FEW: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  SUBTRACTED_ONE_TOO_MANY: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  ADDED_INSTEAD_OF_SUBTRACTED: 'SIMPLIFY_ARITHMETIC__SUBTRACT',
  SUBTRACTED_INSTEAD_OF_ADDED: 'SIMPLIFY_ARITHMETIC__ADD',
} as const

// TODO separate them out.
export const EQUATION_CHANGE_TYPES = [
  // Individually applied Types
  'EQ_REMOVE_TERM',
  'EQ_ADD_TERM',

  ///
  /// Overall Equation Types

  // errors
  'EQ_ATMPT_REMOVAL_BOTH_SIDES',
  'EQ_ADDED_DIFF_TERMS_TO_BOTH_SIDES',
  'EQ_NOT_SAME_OP_PERFORMED',
  'EQ_PLACED_LEFT_SIDE_ONLY',
  'EQ_PLACED_RIGHT_SIDE_ONLY',

  // equation solving success/attempted
  'EQ_ATMPT_OP_BOTH_SIDES',
  'EQ_SWAP_SIDES',
  'EQ_SIMPLIFY_RHS',
  'EQ_SIMPLIFY_LHS',
  'EQ_SIMPLIFY_BOTH',
  'EQ_NO_CHANGE',
  //
  'EQ_CROSS_MULTIPLY',
] as const
export type AEquationChangeType = typeof EQUATION_CHANGE_TYPES[number]
export const EquationChangeTypes: { [K in AEquationChangeType]: K } = Object.fromEntries(EQUATION_CHANGE_TYPES.map(k => [k, k])) as { [K in AEquationChangeType]: K }
