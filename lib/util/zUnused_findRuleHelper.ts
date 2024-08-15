/*
const isAllUpercaseOrNumber = (str: any) => str === str.toUpperCase()
const hasNoSpaces = (str: any) => !str.includes(' ')
const hasOperatorSymbols = (str: any) => str.includes('*') || str.includes('+') || str.includes('/') || str.includes('-')
const getIsId = (anArg: any) => typeof anArg === 'string' && isAllUpercaseOrNumber(anArg) && hasNoSpaces(anArg) && !hasOperatorSymbols(anArg)
const getIsLString = (anArg: any) => typeof anArg === 'string' && !getIsId(anArg)
const getIdFromString = (a: string) => getIsId(a) ? a : null
const getLFromString = (a: string) => getIsLString(a) ? a : null
const getLFromArray = (a: any) => {
  if (Array.isArray(a))
    return a.map(getLFromString).filter((l: any) => l)?.[0]
}
const getIdFromArray = (a: any) => {
  if (Array.isArray(a))
    return a.map(getIdFromString).filter((id: any) => id)?.[0]
}

/!**
 * @param lOrRStringOrArrayLOrRString - l string or id string or array of l string and id string
 * @param rulePool
 * @example findRule('n^0', rulePool) // returns { l: 'n^0', r: '1', id: REDUCE_EXPONENT_BY_ZERO }
 * @example findRule('REDUCE_EXPONENT_BY_ZERO', rulePool) // returns { l: 'n^0', r: '1', id: REDUCE_EXPONENT_BY_ZERO }
 * @example findRule(['n^0', 'REDUCE_EXPONENT_BY_ZERO'], rulePool) // returns { l: 'n^0', r: '1', id: REDUCE_EXPONENT_BY_ZERO }
 *!/
export function findRule<T extends { l?: unknown, id?: unknown }>(lOrRStringOrArrayLOrRString: any, rulePool: T[]) {
  const l = getLFromString(lOrRStringOrArrayLOrRString) || getLFromArray(lOrRStringOrArrayLOrRString)
  const id = getIdFromString(lOrRStringOrArrayLOrRString) || getIdFromArray(lOrRStringOrArrayLOrRString)

  let foundRule
  if (l && id)
    foundRule = rulePool.find(rule => rule.l === l && rule.id === id)
  else if (l)
    foundRule = rulePool.filter(rule => rule.l === l)
  else if (id)
    foundRule = rulePool.filter(rule => rule.id === id)

  if (Array.isArray(foundRule)) {
    if (foundRule.length === 1)
      return foundRule[0]
    else
      throw new Error(`Multiple rules with id: ${id} and l: ${l} found. Please specify id or l, or make id or l unique`)
  }
  if (!foundRule)
    throw new Error('Rule with id or l not found')

  return foundRule
}
*/
