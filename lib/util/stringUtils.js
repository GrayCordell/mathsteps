// @ts-check
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { parseText } from '~/newServices/nodeServices/parseText.js'

/**
 * TODO rename to something like removeSpaces
 * @param str {string}
 * @returns {string}
 */
export const cleanString = str => str.replace(/\s/g, '')

/**
 * TODO rename to something like removeSpacesFromArray
 * @param strArr {string[]}
 * @returns {string[]}
 */
export const cleanStringArray = strArr => strArr.map(cleanString)

/**
 * @param {string} equationStr
 * @returns {string}
 */
export function veryCleanEquation(equationStr) {
  equationStr
    = cleanString(equationStr) // removes spaces
      .replace(/(\d+)\s*\*\s*([a-z]+)/gi, (match, number, variable) => number + variable) // Replace number * variable with numbervariable
      .replaceAll('*', ' * ') // Add spaces around the multiplication operator
      .replaceAll('+', ' + ') // Add spaces around the addition operator
      .replaceAll('-', ' - ') // Add spaces around the subtraction operator
  return equationStr
}

/**
 * @param str {string}
 * @returns {string}
 * This is better than veryCleanEquation. May need better naming with how many different print functions we have... This one is likely best for showing the equation to the user.
 */
export const cleanEquationForShow = (str) => {
  const core = (/** @type {string} */ str) => veryCleanEquation(myNodeToString(parseText((str))))
  if (str.includes('=')) {
    const [left, right] = str.split('=')
    return `${core(left)} = ${core(right)}`
  }
  else {
    return core(str)
  }
}
