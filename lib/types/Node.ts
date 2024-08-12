import type { MathNode } from 'mathjs'

export type GeneralNode = ({
  args: undefined
  op: undefined
} | {
  args: GeneralNode[]
  op: '+' | '-' | '*' | '/' | '^'
}) & MathNode
