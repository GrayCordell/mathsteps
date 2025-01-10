

/* function _makeOpNumbersMap(otherSide: string): Map<'+' | '-' | '*' | '/', string[]> {
  const sortTermsFn = <T extends { index: number }>(terms: T[]): T[] => terms.sort((a, b) => a.index - b.index)
  const filterTermsWithoutParenthesesFn = <T extends { isInParentheses?: boolean }>(terms: T[]): T[] => terms.filter(term => term.isInParentheses === false)

  // convert number(var/number) to numberVar/number

  const transform = pipe(
    parseText,
    removeImplicitMultiplicationFromNode,
    convertNumParVarDivNumToNumVarDivNum,
    flattenAndIndexTrackAST,
    sortTermsFn,
    combineNumberVarTimesTerms,
    combineMakeMinusNegativeTerms,
    makeCountTerms,
    sortTermsFn,
    filterTermsWithoutParenthesesFn,
  )

  const numberOrOpTermsInOtherSide
    = otherSide
      ? transform(otherSide)
      : []

  // for each of these operation index in these terms we need to attempt a check to see if the user tried to use them.
  const opNumberMap = new Map<'+' | '-' | '*' | '/', string[] >()
  let lastOp: '+' | '-' | '*' | '/' | null = null


  for (const term of numberOrOpTermsInOtherSide) {
    if (term && term.operationAppliedToTerm?.position === 'left' && term.operationAppliedToTerm.operation === '*') {
      const op = term.operationAppliedToTerm.operation as '+' | '-' | '*' | '/'
      if (!opNumberMap.has(op))
        opNumberMap.set(op, [])
      opNumberMap.get(op)!.push(term.value)
    }

    if (term.type === 'term' && term.value.startsWith('-')) {
      const op = '-'
      const num = term.value.slice(1)
      if (!opNumberMap.has(op))
        opNumberMap.set(op, [])
      opNumberMap.get(op)!.push(num)
    }
    else if (term.type === 'operator') {
      const op = term.value as '+' | '-' | '*' | '/'
      if (!opNumberMap.has(op))
        opNumberMap.set(op, [])
      lastOp = op
    }
    else {
      if (lastOp) {
        opNumberMap.get(lastOp)!.push(term.value)
      }
      else {
        const isSubtraction = term.value.startsWith('-') // I don't think this is possible
        if (isSubtraction) {
          const op = '-'
          const num = term.value.slice(1)
          if (!opNumberMap.has(op))
            opNumberMap.set(op, [])
          opNumberMap.get(op)!.push(num)
        }
        else {
          if (!opNumberMap.has('+'))
            opNumberMap.set('+', [])
          opNumberMap.get('+')!.push(term.value)
        }
      }
    }
  }
  return opNumberMap
} */

/* export function getOtherSideOptions(
  fromString: string,
  otherSide: string | null,
  history: ProcessedStep[] = [],
): ProcessedStep[] {
  if (!otherSide)
    return []

  let collectQueue: { to: string, addedNumOp: NumberOp }[] = []
  const opNumberMap = _makeOpNumbersMap(otherSide)
  for (const [op, numbers] of opNumberMap.entries()) {
    numbers.forEach((num) => {
      const reverseOp: AOperator = getReverseOp(op as AOperator)
      // if (reverseOp === '-')
      //  reverseOp = '+-'

      const newStep = `(${fromString})${reverseOp}${num}`
      collectQueue.push({ to: newStep, addedNumOp: { op: reverseOp!, number: num } })
    })
  }

  const rgNumberVars = /[-+ ]*\b[+-]?\d*\.?\d+(?:[eE][-+]?\d+)?\s*[a-zA-Z_][a-zA-Z0-9_]*\b/gmi
  const numberVars = otherSide.match(rgNumberVars)
  // remove the vars from the numberVars
  const numbers = numberVars?.map(nv => nv.replace(/[a-z]+/gmi, ''))
  if (numbers) {
    numbers.forEach((num) => {
      const cleanNum = cleanString(cleanString(num).replace('+-', '-').replace('+', ''))
      const newStep = `(${fromString})/${cleanNum}`
      collectQueue.push({ to: newStep, addedNumOp: { op: '/', number: cleanNum } })
    })
  }
  // now just add all the vars
  const letters = otherSide.match(/[+-]*[a-z]/gi)
  if (letters) {
    letters.forEach((letter) => {
      const cleanLetter = cleanString(cleanString(letter).replace('+-', '-').replace('+', ''))
      const newStep = `(${fromString})/1${cleanLetter}`
      collectQueue.push({ to: newStep, addedNumOp: { op: '*', number: `1${cleanLetter}` } })
    })
  }

  const allEqualFn = (a: { to: string, addedNumOp: NumberOp }, b: { to: string, addedNumOp: NumberOp }) => a.to === b.to && a.addedNumOp.op === b.addedNumOp.op && a.addedNumOp.number === b.addedNumOp.number
  collectQueue = filterUniqueValues(collectQueue, (a, b) => allEqualFn(a, b))


  // remove ones where the added numOp is a 0
  collectQueue = collectQueue.filter(({ addedNumOp }) => addedNumOp.number !== '0')

  // remove the ones that are already in history
  const previousAddedNumOps = history.filter(step => step.addedNumOp).map(step => step.addedNumOp)
  collectQueue = collectQueue.filter(term => !previousAddedNumOps.some(prev => prev!.number === term.addedNumOp.number && prev!.op === term.addedNumOp.op))

  // convert to ProcessedStep
  return collectQueue.map(({ to, addedNumOp }) => ({
    from: fromString,
    changeType: changeTypeBasedOnAddedOpFn(addedNumOp.op),
    addedNumOp,
    to,
    isMistake: false,
    availableChangeTypes: ['EQ_ADD_TERM' as const],
  }))
} */
