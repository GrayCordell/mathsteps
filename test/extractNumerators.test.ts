import { describe, expect, it } from 'vitest'
import { extractNumerators } from '~/newServices/nodeServices/extractNumerators'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString'
import { parseText } from '~/newServices/nodeServices/parseText'

describe('extractNumerators', () => {
  it('should extract numerators from a simple division', () => {
    const node = parseText('a / b')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a'])
  })

  it('should handle nested divisions', () => {
    const node = parseText('(a / b) / c')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a/b', 'a'])
  })

  it('should handle divisions combined with multiplication', () => {
    const node = parseText('(a / b) * (c / d)')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a', 'c'])
  })

  it('should handle standalone numerators in mixed expressions', () => {
    const node = parseText('a * b / c')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a*b'])
  })
  it('should handle identical numerators', () => {
    const node = parseText('a / b + a / c')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a', 'a'])
  })

  it('should handle constant numerators', () => {
    const node = parseText('2 / b')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['2'])
  })

  it('should return nothing if no division exists', () => {
    const node = parseText('a * b')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual([])
  })

  it('should handle complex expressions with addition and subtraction', () => {
    const node = parseText('(a+b)/c - d/2')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a+b', 'd'])
  })
  it('should handle complex expressions with many divisions', () => {
    const node = parseText('((a*b)/c * (d/e)) / f')
    const numerators = extractNumerators(node)
    expect(numerators.map(myNodeToString)).toEqual(['a*b/c*d/e', 'a*b', 'd'])
  })

  // it('should handle mixed operations', () => {
  //  const node = parseText('0+3/4*4/2')
  //  const numerators = extractNumerators(node)
  //  expect(numerators.map(node => myNodeToString(node))).toEqual(['3', '4'])
  // })
})
