// This file is meant to be a mapping of Math Rules to ChangeTypes.
import type { AChangeType, AChangeTypeCore } from '~/types/changeType/ChangeTypes'
import { objectEntries } from '~/types/objectEntries'

export const ALL_MATH_RULES = [
  'Addition_Property_Of_Equality',
  'Subtraction_Property_Of_Equality',
  'Multiplication_Property_Of_Equality',
  'Division_Property_Of_Equality',
  'Distributive_Property',
  'Combining_Like_Terms_Expressions',
  'Combining_Like_Terms_Fractions',
  'Simplify_Signs',
  'Cross_Multiply',
] as const

export type AMathRule = typeof ALL_MATH_RULES[number]


// These are supposed to be "Math Rule" Mappings to specific ChangeTypes.
export const MATH_RULE_TO_CHANGE_TYPE_MAPPING: Record<AMathRule, AChangeType[]> = {
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
  /*
  We use this rule in as an action. Its special because this isn't in available ChangeTypes. We do use something like this for 'swap' action in commander.
  Symmetric_Property_Of_Equality: [
    'Does not exist. Its "swap" technically.' //EQ_SWAP_SIDES would make most sense here though.
  ]
  * */
  Combining_Like_Terms_Expressions: [
    'COLLECT_AND_COMBINE_LIKE_TERMS',
    'SIMPLIFY_ARITHMETIC__ADD',
    'SIMPLIFY_ARITHMETIC__SUBTRACT',
    'SIMPLIFY_ARITHMETIC__MULTIPLY',
    'SIMPLIFY_ARITHMETIC__DIVIDE',
    'MULTIPLY_BY_ZERO',
    'REMOVE_ADDING_ZERO',
    'REMOVE_MULTIPLYING_BY_ONE',
    'DISTRIBUTE_NEGATIVE_ONE',
    'CANCEL_TERMS_FOR_ADDITION',
  ],
  Combining_Like_Terms_Fractions: [
    'CANCEL_TERMS_FOR_FRACTION',
    'MULTIPLY_FRACTIONS', //
    'ADD_FRACTIONS', //
    'COMMON_DENOMINATOR', //
    'KEMU_DECIMAL_TO_FRACTION',
    'KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR', /*  { l: 'n1 * 1/n2', r: 'n1/n2', id: ChangeTypes.KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR }, { l: '1/v2 * n1', r: 'n1/v2', id: ChangeTypes.KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR }, */
    'KEMU_REMOVE_DOUBLE_FRACTION',
    'REDUCE_ZERO_NUMERATOR',
  ],
  Simplify_Signs: ['SIMPLIFY_SIGNS'],
  Cross_Multiply: ['EQ_CROSS_MULTIPLY'],
} as const

export const getMathRuleForChangeType = (changeType: AChangeTypeCore): AMathRule | null => {
  const entries = objectEntries(MATH_RULE_TO_CHANGE_TYPE_MAPPING)
  const foundRuleEntry = entries.find(([rule, changeTypes]) => changeTypes.includes(changeType))
  if (!foundRuleEntry)
    return null
  return foundRuleEntry[0] // return the rule only(not the changeTypes)
}
export const getChangesTypesForRule = (rule: AMathRule): AChangeType[] => MATH_RULE_TO_CHANGE_TYPE_MAPPING[rule]

export const sloppilyGetRuleBasedOnUserString = (userString: string): AMathRule | null | 'all' => {
  userString = userString.toLowerCase().trim().replace(/\s+/g, ' ')

  const isCombinedTerms = userString.includes('like') || userString.includes('combin')

  if (userString.includes('add'))
    return 'Addition_Property_Of_Equality'
  if (userString.includes('subt'))
    return 'Subtraction_Property_Of_Equality'
  if (userString.includes('mult'))
    return 'Multiplication_Property_Of_Equality'
  if (userString.includes('div'))
    return 'Division_Property_Of_Equality'
  if (userString.includes('dist'))
    return 'Distributive_Property'
  if (isCombinedTerms && userString.includes('frac'))
    return 'Combining_Like_Terms_Fractions'
  if (isCombinedTerms && (userString.includes('expr') || userString.includes('equat') || userString.includes('numbers')))
    return 'Combining_Like_Terms_Expressions'
  if (userString.includes('simp') || userString.includes('sign'))
    return 'Simplify_Signs'
  if (userString.includes('cross'))
    return 'Cross_Multiply'
  if (userString === 'all')
    return 'all'
  return null
}
