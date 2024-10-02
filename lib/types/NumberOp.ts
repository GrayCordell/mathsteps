import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'

export interface NumberOp {
  op: AOperator
  number: string
  dfsNodeId?: number
  depth?: number
}
