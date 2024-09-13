import type { SimplifyDeep } from 'type-fest'
import { changeGroupMappings } from '~/types/changeType/declareChangeTypesHere'

// Helper type to extract all literals from groupMappings
type LiteralUnion<T extends Record<string, readonly string[]>> = SimplifyDeep<T[keyof T][number]>

// Dynamically merge all rules into ChangeTypes while retaining type information.
export const ChangeTypes: { [K in LiteralUnion<typeof changeGroupMappings>]: K } = {
  ...Object.values(changeGroupMappings)
    .flatMap(rules => rules.map(rule => ({ [rule]: rule })))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
} as const as { [K in LiteralUnion<typeof changeGroupMappings>]: K }

export type AChangeTypeCore = typeof ChangeTypes[keyof typeof ChangeTypes] // ex. 'SIMPLIFY_ARITHMETIC__OP'
export type AChangeTypeWithCase = `${AChangeTypeCore}__CASE_${number}` // ex. 'SIMPLIFY_ARITHMETIC__OP__CASE_1'
export type AChangeType = AChangeTypeCore | AChangeTypeWithCase // ex. 'SIMPLIFY_ARITHMETIC__OP' | 'SIMPLIFY_ARITHMETIC__OP__CASE_1'

export type AChangeTypeGroup = keyof typeof changeGroupMappings // ex. 'SimplifyArithmetic'
export const ChangeTypeGroups = Object.keys(changeGroupMappings) as AChangeTypeGroup[] // ex. ['SimplifyArithmetic', 'AdditionRules', ...]
