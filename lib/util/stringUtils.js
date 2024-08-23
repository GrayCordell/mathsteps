// @ts-check
/**
 *
 * @param str {string}
 * @returns {string}
 */
export const cleanString = str => str.replace(/\s/g, '')

/**
 *
 * @param strArr {string[]}
 * @returns {string[]}
 */
export const cleanStringArray = strArr => strArr.map(cleanString)

/**
 * @param {string} equationStr
 * @returns {string}
 */
export function veryCleanEquation(equationStr) {
  const cleaned0 = cleanString(equationStr)
  // Define the regex pattern to match number * variable
  const pattern = /(\d+)\s*\*\s*([a-z]+)/gi
  // Use the replace method with a callback to format the match
  let numberVariablizedString = cleaned0.replace(pattern, (match, number, variable) => {
    return number + variable
  })
  numberVariablizedString = numberVariablizedString.replaceAll('*', ' * ')
  numberVariablizedString = numberVariablizedString.replaceAll('+', ' + ')
  numberVariablizedString = numberVariablizedString.replaceAll('-', ' - ')
  return numberVariablizedString
}
