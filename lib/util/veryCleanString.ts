import { cleanString } from '~/util/cleanString'

export function veryCleanEquation(equationStr: string) {
  equationStr
    = cleanString(equationStr) // removes spaces
      .replace(/(\d+)\s*\*\s*([a-z]+)/gi, (match, number, variable) => number + variable) // Replace number * variable with numbervariable
      .replaceAll('*', ' * ') // Add spaces around the multiplication operator
      .replaceAll('+', ' + ') // Add spaces around the addition operator
      .replaceAll('-', ' - ') // Add spaces around the subtraction operator
  return equationStr
}
