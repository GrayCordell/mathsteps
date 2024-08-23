// I am not sure how many I want to do using regex. It wasn't really planned but I may brute force some of these for now.

/**
 * Finds and generates alternative interpretations of a mathematical expression
 * where addition is incorrectly prioritized before multiplication, as per common PEMDAS mistakes.
 *
 * This function specifically targets expressions that involve both addition and multiplication
 * where the typical operator precedence might be misunderstood, and it provides alternative
 * calculations reflecting this misunderstanding.
 *
 * @param {string} expressionString - The mathematical expression as a string (e.g., "1 + 2 * 2 + 2").
 * @returns {string[]} An array of alternative interpretations of the expression with addition
 *                     prioritized before multiplication, where applicable.
 *
 * @example
 * // Returns ['4*2 + 2', '1 + 2.5*4']
 * findMultiplyBeforeAddMistakes('1.5 + 2.5 * 2 + 2');
 *
 * @example
 * // Returns ['3*2.5 + 3', '1 + 2*5.5']
 * findMultiplyBeforeAddMistakes('1 + 2 * 2.5 + 3');
 */
export function findMultiplyBeforeAddMistakes(expressionString) {
  if (!expressionString.includes('*') || !expressionString.includes('+')) {
    return []
  }

  // Update the number regex to handle both integers and decimals
  const rgNum = '\\d+(?:\\.\\d+)?'
  const rgAdd = '\\+'
  const rgMult = '\\*'

  // Optimized regex patterns to detect common mistake patterns
  const interpretation1Regex = new RegExp(`(${rgNum})${rgAdd}(${rgNum})${rgMult}`, 'g')
  const interpretation2Regex = new RegExp(`${rgMult}(${rgNum})${rgAdd}(${rgNum})`, 'g')

  const alternativeInterpretations = new Set()

  // Function to safely replace part of the string while considering context
  function generateAlternative(expression, match, startIndex, endIndex, calculatedPart) {
    return expression.slice(0, startIndex) + calculatedPart + expression.slice(endIndex)
  }

  // Handler for the first pattern where addition is mistakenly prioritized before multiplication
  processMatches(interpretation1Regex, expressionString, (match) => {
    const [fullMatch, num1, num2] = match
    const addedValue = Number.parseFloat(num1) + Number.parseFloat(num2)
    const newExpression = generateAlternative(
      expressionString,
      fullMatch,
      match.index,
      match.index + fullMatch.length,
      `${addedValue}*${match[0].split('*')[1]}`,
    )
    alternativeInterpretations.add(newExpression)
  })

  // Handler for the second pattern where multiplication might be incorrectly prioritized
  processMatches(interpretation2Regex, expressionString, (match) => {
    const [fullMatch, num1, num2] = match
    const addedValue = Number.parseFloat(num1) + Number.parseFloat(num2)
    const newExpression = generateAlternative(
      expressionString,
      fullMatch,
      match.index,
      match.index + fullMatch.length,
      `${match[0].split('*')[0]}*${addedValue}`,
    )
    alternativeInterpretations.add(newExpression)
  })

  // Return the unique interpretations as an array
  return Array.from(alternativeInterpretations)
}
/*
export function findIgnoredParenthesesMistakes(expressionString) {
  if (!expressionString.includes('(') || !expressionString.includes('*')) {
    return []
  }
  // Update the number regex to handle both integers and decimals
  const rgNum = '\\d+(?:\\.\\d+)?'
  const rgAdd = '\\+'
  const rgMult = '\\*'
  const lParen = '\\('
  const rParen = '\\)'

  // Regex patterns to detect common mistakes involving ignored parentheses
  // interpretation1 = 2*(3+4) -> 2*3+4 -> 6+4
  // interpretation2 = (2+3)*4 -> 2+3*4 -> 2+12
  const interpretation1Regex = new RegExp(`(${rgNum})${rgMult}${lParen}(${rgNum})`, 'g')
  const interpretation2Regex = new RegExp(`(${rgNum})${rParen}${rgMult}(${rgNum})`, 'g')

  const alternativeInterpretations = new Set()

  // Function to safely replace part of the string while considering context
  function generateAlternative(expression, match, startIndex, endIndex, calculatedPart) {
    return expression.slice(0, startIndex) + calculatedPart + expression.slice(endIndex)
  }

  // Handler for the first pattern: number followed by parentheses (e.g., 2*(3+4)) -> 2*3+4 -> 6+4
  processMatches(interpretation1Regex, expressionString, (match) => {
    const [fullMatch, num1, num2, num3] = match
    const calculatedPart = Number.parseFloat(num1) * Number.parseFloat(num2)
    const newExpression = generateAlternative(
      expressionString,
      fullMatch,
      match.index,
      match.index + fullMatch.length,
      `${calculatedPart}+${num3}`,
    )

    alternativeInterpretations.add(newExpression)
  })

  // Handler for the second pattern: parentheses followed by multiplication (e.g., (3+4)*2) -> 3+4*2 -> 3+8
  processMatches(interpretation2Regex, expressionString, (match) => {
    const [fullMatch, num1, num2] = match
    const calculatedPart = Number.parseFloat(num1) * Number.parseFloat(num2)
    let newExpression = generateAlternative(
      expressionString,
      fullMatch,
      match.index,
      match.index + fullMatch.length,
      `${calculatedPart})`,
    )
    if (newExpression[0] === '(' && newExpression[newExpression.length - 1] === ')') {
      newExpression = newExpression.slice(1, newExpression.length - 1)
    }
    alternativeInterpretations.add(newExpression)
  })

  // Return the unique interpretations as an array
  return Array.from(alternativeInterpretations)
}
*/

export function mistakeSearches(start) {
  const addBeforeMultMistakes = []
  findMultiplyBeforeAddMistakes(start).forEach((mistake) => {
    addBeforeMultMistakes.push({
      from: start,
      to: mistake,
      changeType: 'PEMDAS__ADD_INSTEAD_OF_MULTIPLY',
      isMistake: true,
      attemptedToGetTo: 'UNKNOWN',
    })
  })

  // const ignoredParenthesesMistakes = []
  // findIgnoredParenthesesMistakes(start).forEach((mistake) => {
  //   ignoredParenthesesMistakes.push({
  //     from: start,
  //     to: mistake,
  //     changeType: 'PEMDAS__IGNORED_PARENTHESES',
  //     isMistake: true,
  //     attemptedToGetTo: 'UNKNOWN',
  //   })
  // })

  const pemdasAddBeforeMultMistake = addBeforeMultMistakes[0]
    ? {
        ...addBeforeMultMistakes[0],
        mTo: addBeforeMultMistakes,
      }
    : null

  /* const pemdasIgnoredParenthesesMistake = ignoredParenthesesMistakes[0]
    ? {
        ...ignoredParenthesesMistakes[0],
        mTo: ignoredParenthesesMistakes,
      }
    : null */

  // Return both types of mistakes
  return [pemdasAddBeforeMultMistake].filter(mistake => mistake)
}

// UTILS
// Function to process regex matches and generate alternatives
function processMatches(regex, str, handler) {
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(str)) !== null) {
    handler(match)
  }
}
