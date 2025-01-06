

type RegexFlags =
  'g' | 'i' | 'm' | 's' | 'u' | 'y' |
  'gi' | 'gm' | 'gs' | 'gu' | 'gy' | 'mi' | 'ms' | 'mu' | 'my' | 'si' | 'su' | 'sy' | 'iu' |
  'gim' | 'gis' | 'giu' | 'giy' | 'gms' | 'gmu' | 'gmy' | 'gsu' | 'gsy' | 'gius' | 'giuy' | 'gisy' | 'gmsu' | 'gmsy' | 'gmyu' | 'gsuy' | 'giusy' | 'gmsuy'

export function escapeStringRegexp(string: string) {
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d')
}

/**
 * Creates an extended regular expression by removing comments and unescaped whitespace
 * from the provided pattern string, then constructing a `RegExp` object with the specified flags.
 *
 * This utility function allows for more readable regular expression patterns by supporting:
 * - Inline comments (starting with `#`), which are stripped out.
 * - Unescaped whitespace, which is also removed to compact the pattern.
 *
 * `String.raw` is used to ensure escape sequences in the pattern (e.g., `\d`, `\s`) are treated
 * as literal text and not interpreted by JavaScript.
 *
 * @param {string} inputPatternStr - The raw regular expression pattern string, potentially with comments and extra whitespace.
 * @param {RegexFlags} flags - A combination of regular expression flags to apply (e.g., 'g', 'i', 'm').
 *    Valid flags include:
 *    - `g`: Global match.
 *    - `i`: Case-insensitive match.
 *    - `m`: Multiline match.
 *    - `s`: Dot matches newline (dotall).
 *    - `u`: Unicode mode.
 *    - `y`: Sticky match.
 *    - Combinations of the above flags (e.g., 'gi', 'gim', etc.).
 *
 * @returns {RegExp} A `RegExp` object constructed from the cleaned pattern string and the provided flags.
 *
 * @example
 * // Example demonstrating comments, whitespace usage, and String.raw
 * const pattern = String.raw`
 *   ^         # Match the start of the string
 *   \d{3}     # Match exactly three digits (e.g., area code)
 *   [-.\s]?   # Match an optional separator: dash, dot, or space
 *   \d{3}     # Match the next three digits
 *   [-.\s]?   # Match another optional separator
 *   \d{4}     # Match the final four digits
 *   $         # Match the end of the string
 * `;
 *
 * const regex = makeExtendedRegExp(pattern, 'g');
 * console.log(regex); // Output: /^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/g
 *
 * @example
 * // Using the resulting regex
 * const phoneNumbers = 'Call me at 123-456-7890 or 987 654 3210.';
 * const regex = makeExtendedRegExp(String.raw`
 *   \d{3}     # Match the area code
 *   [-.\s]?   # Match an optional separator
 *   \d{3}     # Match the central office code
 *   [-.\s]?   # Match another optional separator
 *   \d{4}     # Match the line number
 * `, 'g');
 * const matches = phoneNumbers.match(regex);
 * console.log(matches); // Output: ['123-456-7890', '987 654 3210']
 */
export function makeExtendedRegExp(inputPatternStr: string, flags: RegexFlags): RegExp {
  // Remove everything between the first unescaped # and the end of a line
  // and then remove all unescaped whitespace
  const cleanedPatternStr = inputPatternStr
    .replace(/(^|[^\\])#.*/g, '$1')
    .replace(/(^|[^\\])\s+/g, '$1')
  return new RegExp(cleanedPatternStr, flags)
}

// Matches standalone numbers, including integers and decimals
export const RGIntOrDecimal = makeExtendedRegExp(String.raw`
  \d+         # Match one or more digits (integer part)
  (?:\.\d+)?  # Optionally match a decimal point followed by digits
`, 'g')

// Matches standalone variables (letters only)
export const RGVariable = makeExtendedRegExp(String.raw`
  [a-zA-Z]   # Match one alphabetic characters
`, 'g')

export const RGOptionalVariable = makeExtendedRegExp(String.raw`
  [a-zA-Z]?   # Match one alphabetic characters or none
`, 'g')


// Combines numberRegex and variableRegex for combined patterns
export const RGNumbersAndOrVar = makeExtendedRegExp(String.raw`
  (?:${RGIntOrDecimal.source}${RGOptionalVariable.source})
  |
  (?:${RGVariable.source})
`, 'g')

// (?:((?:\d+(?:\.\d+)?[a-z]?)|(?:[a-z]))\/)+((?:\d+(?:\.\d+)?[a-z]?)|(?:[a-z]))
export const RGFraction = makeExtendedRegExp(String.raw`
(?:(${RGNumbersAndOrVar.source})\/)+(${RGNumbersAndOrVar.source})
`, 'g')

