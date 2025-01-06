// CURRENTLY UNUSED FILE
// This file is meant to be a mapping of Math Rules to ChangeTypes.
// This is a work in progress.
import type { AChangeTypeCore } from '~/types/changeType/ChangeTypes'


type MathRules = 'Addition_Property_Of_Equality' | 'Subtraction_Property_Of_Equality' | 'Multiplication_Property_Of_Equality' | 'Division_Property_Of_Equality' | 'Distributive_Property' | 'Combining_Like_Terms' | 'Simplify_Signs' | 'EQ_CROSS_MULTIPLY'

type Ordered = AChangeTypeCore[]
type temp = AChangeTypeCore | Record<string, Ordered[]>
// These are supposed to be "Math Rule" Mappings to specific ChangeTypes.
export const SAMPLE_RULE_MAPPINGS: Record<MathRules, temp[]> = {
  Addition_Property_Of_Equality: [
    'EQ_ADD_TERM_BY_ADDITION',
    'EQ_REMOVE_TERM_BY_ADDITION',
  ],
  Subtraction_Property_Of_Equality: [
    'EQ_ADD_TERM_BY_SUBTRACTION',
    'EQ_REMOVE_TERM_BY_SUBTRACTION',
  ],
  Multiplication_Property_Of_Equality: [
    'EQ_ADD_TERM_BY_MULTIPLICATION',
    'EQ_REMOVE_TERM_BY_MULTIPLICATION',
  ],
  Division_Property_Of_Equality: [
    'EQ_ADD_TERM_BY_DIVISION',
    'EQ_REMOVE_TERM_BY_DIVISION',
  ],
  Distributive_Property: [
    'KEMU_DISTRIBUTE_MUL_OVER_ADD', // and subtract
    'BREAK_UP_FRACTION', // divide over add
  ],
  Combining_Like_Terms: [
    'COLLECT_AND_COMBINE_LIKE_TERMS',
    'SIMPLIFY_ARITHMETIC__ADD',
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
    'SIMPLIFY_ARITHMETIC__MULTIPLY',
    'SIMPLIFY_ARITHMETIC__DIVIDE',
    // Fractions
    'MULTIPLY_FRACTIONS', //
    'ADD_FRACTIONS', //
    'COMMON_DENOMINATOR', //
    'KEMU_DECIMAL_TO_FRACTION',
    'KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR', /*  { l: 'n1 * 1/n2', r: 'n1/n2', id: ChangeTypes.KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR }, { l: '1/v2 * n1', r: 'n1/v2', id: ChangeTypes.KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR }, */
    'KEMU_REMOVE_DOUBLE_FRACTION',
    'REDUCE_ZERO_NUMERATOR',
  ],
  Simplify_Signs: [
    'SIMPLIFY_SIGNS',
  ],
  EQ_CROSS_MULTIPLY: [
    'EQ_CROSS_MULTIPLY',
  ],
}
