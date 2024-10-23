type RegexFlags =
  'g' | 'i' | 'm' | 's' | 'u' | 'y' |
  'gi' | 'gm' | 'gs' | 'gu' | 'gy' | 'mi' | 'ms' | 'mu' | 'my' | 'si' | 'su' | 'sy' | 'iu' |
  'gim' | 'gis' | 'giu' | 'giy' | 'gms' | 'gmu' | 'gmy' | 'gsu' | 'gsy' | 'gius' | 'giuy' | 'gisy' | 'gmsu' | 'gmsy' | 'gmyu' | 'gsuy' | 'giusy' | 'gmsuy'

export function makeExtendedRegExp(inputPatternStr: string, flags: RegexFlags): RegExp {
  // Remove everything between the first unescaped # and the end of a line
  // and then remove all unescaped whitespace
  const cleanedPatternStr = inputPatternStr
    .replace(/(^|[^\\])#.*/g, '$1')
    .replace(/(^|[^\\])\s+/g, '$1')
  return new RegExp(cleanedPatternStr, flags)
}
