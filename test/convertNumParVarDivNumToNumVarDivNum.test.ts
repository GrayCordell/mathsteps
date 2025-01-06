import { describe, expect, it } from 'vitest'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { convertNumParVarDivNumToNumVarDivNum } from '~/simplifyExpression/mscNormalizeNodeFunctions'
import { cleanString } from '~/util/stringUtils'

describe('convertNumParVarDivNumToNumVarDivNum function test', () => {
  it('should convert \'3 * (x / 4)\' to \'(3 * x) / 4\'', () => {
    const input = '3 * (x / 4)'
    const output = myNodeToString(convertNumParVarDivNumToNumVarDivNum((input)))
    expect(output).toBe(cleanString('3*x/4'))
  })

  it('should handle multiple transformations in a single expression', () => {
    const input = '3 * (x / 4) + 5 * (y / 2) - 2 * (z / 5)'
    const output = myNodeToString(convertNumParVarDivNumToNumVarDivNum((input)))
    expect(output).toBe(cleanString('3*x/4+5*y/2-2*z/5'))
  })
})
