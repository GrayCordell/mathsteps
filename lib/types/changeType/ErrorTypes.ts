import type { SimplifyDeep } from 'type-fest'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { changeGroupMappings, mistakeOnlyGroupMappings } from '~/types/changeType/declareChangeTypesHere'
import { mergeObjArrays } from '~/types/mscTypeUtils'

type LiteralUnion<T extends Record<string, readonly string[]>> = SimplifyDeep<T[keyof T][number]>

// Dynamically merge all rules into ChangeTypes while retaining type information.
export const mistakeGroupMappings = mergeObjArrays(changeGroupMappings, mistakeOnlyGroupMappings)
export const MistakeTypes: { [K in LiteralUnion<typeof mistakeGroupMappings>]: K } = {
  ...Object.values(mistakeGroupMappings)
    .flatMap(rules => rules.map(rule => ({ [rule]: rule })))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
} as const as { [K in LiteralUnion<typeof mistakeGroupMappings>]: K }

export type AMistakeType = typeof MistakeTypes[keyof typeof MistakeTypes] | AChangeType | null
export type AMistakeTypeGroup = keyof typeof mistakeGroupMappings
export const MistakeTypeGroups = Object.keys(mistakeGroupMappings) as AMistakeTypeGroup[]
