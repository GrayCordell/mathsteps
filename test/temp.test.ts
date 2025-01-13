import { describe, expect } from 'vitest'
import { RUN_DEV_MATH_RULE_CLI } from '~/WIP/CLI'


describe('temp', async () => {
  await RUN_DEV_MATH_RULE_CLI()
  expect(true).toBe(true)
})
