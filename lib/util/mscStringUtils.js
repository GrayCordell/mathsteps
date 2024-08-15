export const cleanString = string => string.replace(/\s/g, '')
export const cleanStringArray = arr => arr.map(cleanString)

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
