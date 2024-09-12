import type { SimplifyDeep } from 'type-fest'
import { mergeObjArrays } from '~/types/mscTypeUtils'
import type { AChangeType } from '~/types/changeType/ChangeTypes'
import { changeGroupMappings, mistakeGroupMappings } from '~/types/changeType/declareChangeTypesHere'

type LiteralUnion<T extends Record<string, readonly string[]>> = SimplifyDeep<T[keyof T][number]>

// Dynamically merge all rules into ChangeTypes while retaining type information.
const mergedMistakeAndChange = mergeObjArrays(changeGroupMappings, mistakeGroupMappings)
export const MistakeTypes: { [K in LiteralUnion<typeof mergedMistakeAndChange>]: K } = {
  ...Object.values(mergedMistakeAndChange)
    .flatMap(rules => rules.map(rule => ({ [rule]: rule })))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
} as { [K in LiteralUnion<typeof mergedMistakeAndChange>]: K }

export type AMistakeType = typeof MistakeTypes[keyof typeof MistakeTypes] | AChangeType | null
export type AMistakeTypeGroup = keyof typeof mistakeGroupMappings
export const MistakeTypeGroups = Object.keys(mistakeGroupMappings) as AMistakeTypeGroup[]
