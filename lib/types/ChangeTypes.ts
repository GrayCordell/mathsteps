// Shared constants
import type { SimplifyDeep } from 'type-fest'

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

// Declaring groupMappings directly with the groupings
const groupMappings = {
  SimplifyArithmetic: [
    'SIMPLIFY_ARITHMETIC',
    'SIMPLIFY_ARITHMETIC__ADD',
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
    SIMPLIFY_ARITHMETIC_MULTIPLY,
    'SIMPLIFY_ARITHMETIC__POWER',
    KEMU_DISTRIBUTE_MUL_OVER_ADD,
  ] as const,

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
  ] as const,

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
  ] as const,

  CoefficientSimplificationRules: [
    'REARRANGE_COEFF',
    'CANCEL_MINUSES',
    'CANCEL_TERMS',
    'KEMU_FACTOR_EXPRESSION_UNDER_ROOT',
  ] as const,

  ExponentSimplificationRules: [
    'REDUCE_EXPONENT_BY_ZERO',
    'REMOVE_EXPONENT_BY_ONE',
    'REMOVE_EXPONENT_BASE_ONE',
    'REMOVE_EXPONENT_BASE_ZERO',
    KEMU_POWER_FACTORS,
    KEMU_POWER_TO_MINUS_ONE,
    KEMU_POWER_TO_NEGATIVE_EXPONENT,
  ] as const,

  ExpressionSimplificationRules: [
    'REMOVE_ADDING_ZERO',
    'REMOVE_MULTIPLYING_BY_NEGATIVE_ONE',
    'REMOVE_MULTIPLYING_BY_ONE',
    'RESOLVE_DOUBLE_MINUS',
    'SIMPLIFY_SIGNS',
    'COLLECT_AND_COMBINE_LIKE_TERMS',
    'KEMU_REMOVE_UNNEDED_PARENTHESIS',
    'KEMU_ORIGINAL_EXPRESSION',
  ] as const,

  AbsoluteValueRules: ['ABSOLUTE_VALUE'] as const,
  UNKNOWN: ['UNKNOWN'] as const,

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
  ] as const,

  TrigonometricRules: [
    'KEMU_PYTHAGOREAN_IDENTITY',
    'KEMU_EVEN_FUNCTION_OF_NEGATIVE',
    'KEMU_ODD_FUNCTION_OF_NEGATIVE',
    'KEMU_CONVERT_SIN_PER_COS_TO_TAN',
    'KEMU_CONVERT_COS_PER_SIN_TO_COT',
    'KEMU_CANCEL_INVERSE_FUNCTION',
    'KEMU_FUNCTION_VALUE',
  ] as const,

  LogarithmRules: [
    'KEMU_LOG_XY_FROM_ONE',
    'KEMU_LOG_XY_FROM_BASE',
    'KEMU_LOG_XY_FROM_POWER',
  ] as const,

  PercentageRules: [
    PERCENTS_ADD,
    PERCENTS_SUB,
    PERCENTS_CONVERT_TO_FRACTION,
  ] as const,

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
  ] as const,
} as const

// Helper type to extract all literals from groupMappings
type LiteralUnion<T extends Record<string, readonly string[]>> = SimplifyDeep<T[keyof T][number]>

// Dynamically merge all rules into ChangeTypes while retaining type information
export const ChangeTypes: { [K in LiteralUnion<typeof groupMappings>]: K } = Object.assign(
  {},
  ...Object.values(groupMappings).flatMap(rules =>
    rules.map(rule => ({ [rule]: rule })),
  ),
) as { [K in LiteralUnion<typeof groupMappings>]: K }

export type AChangeTypeCore = typeof ChangeTypes[keyof typeof ChangeTypes]
type AChangeTypeWithCase = `${AChangeTypeCore}__CASE_${number}`
export type AChangeType = AChangeTypeCore | AChangeTypeWithCase

export type ChangeTypeGroup = keyof typeof groupMappings

// function to determine the groups a changeType belongs to
export const getChangeTypeGroups = (changeType_: AChangeType | string): ChangeTypeGroup[] => {
  const changeType: AChangeType = changeType_?.includes('__CASE_')
    ? changeType_.split('__CASE_')[0] as AChangeType
    : changeType_ as AChangeType

  // Find which group(s) this changeType belongs to and return the tags
  const firstPass = Object.entries(groupMappings) // @ts-expect-error ---
    .filter(([_, rules]) => rules.includes(changeType))
    .map(([tag]) => tag as ChangeTypeGroup)

  const secondPass = []
  if (!firstPass || firstPass.length === 0) {
    if (changeType.includes('MULTIPLY'))
      secondPass.push('MultiplicationRules')
    if (changeType.includes('DIVIDE'))
      secondPass.push('DivisionRules')
    if (changeType.includes('ADD') || changeType.includes('SUBTRACT'))
      secondPass.push('SimplifyArithmetic')
    if (changeType.includes('ADD'))
      secondPass.push('AdditionRules')
    if (changeType.includes('Subtract'))
      secondPass.push('SubtractionRules')
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
  return [...firstPass, ...secondPass] as ChangeTypeGroup[]
}

export default ChangeTypes
