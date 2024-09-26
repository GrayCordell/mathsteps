import { parseText } from '~/index'
import { combineMakeMinusNegativeTerms, combineNumberVarTimesTerms, flattenAndIndexTrackAST, makeCountTerms } from '~/newServices/nodeServices/nodeHelpers'
import type { AOperator } from '~/types/changeType/changeAndMistakeUtils'
import { getReverseOp } from '~/types/changeType/changeAndMistakeUtils'
import { filterUniqueValues } from '~/util/arrayUtils'
import { cleanString } from '~/util/stringUtils'

function makeOpNumbersMap(otherSide: string): Map<'+' | '-' | '*' | '/', string[]> {
  const numberOrOpTermsInOtherSide
    = otherSide
      ? makeCountTerms(combineMakeMinusNegativeTerms(combineNumberVarTimesTerms(flattenAndIndexTrackAST(parseText(otherSide)).sort((a, b) => a.index! - b.index!)))).sort((a, b) => a.index - b.index)
      : []
  // for each of these operation index in these terms we need to attempt a check to see if the user tried to use them.
  const opNumberMap = new Map<'+' | '-' | '*' | '/', string[] >()
  let lastOp: '+' | '-' | '*' | '/' | null = null
  for (const term of numberOrOpTermsInOtherSide) {
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
}

export function getOtherSideOptions(start: string, otherSide: string): { start: string, sideCheckNumOp: { op: AOperator, number: string } }[] {
  let collectQueue: { start: string, sideCheckNumOp: { op: AOperator, number: string } }[] = []
  const opNumberMap = makeOpNumbersMap(otherSide)
  for (const [op, numbers] of opNumberMap.entries()) {
    numbers.forEach((num) => {
      let reverseOp: AOperator = getReverseOp(op as AOperator)
      if (reverseOp === '-')
        reverseOp = '+-'

      const newStep = `(${start})${reverseOp}${num}`
      collectQueue.push({ start: newStep, sideCheckNumOp: { op: reverseOp!, number: num } })
    })
  }
  // handle where there are not any operations in the other side
  if (opNumberMap.size === 0) {
    const newStep = `${start}+-${otherSide}`
    collectQueue.push({ start: newStep, sideCheckNumOp: { op: '+-', number: otherSide } })
  }
  const rgNumberVars = /[-+ ]*\b[+-]?\d*\.?\d+(?:[eE][-+]?\d+)?\s*[a-zA-Z_][a-zA-Z0-9_]*\b/gmi
  const numberVars = otherSide.match(rgNumberVars)
  // remove the vars from the numberVars
  const numbers = numberVars?.map(nv => nv.replace(/[a-z]+/gmi, ''))
  if (numbers) {
    numbers.forEach((num) => {
      const cleanNum = cleanString(cleanString(num).replace('+-', '-').replace('+', ''))
      const newStep = `(${start})/${cleanNum}`
      collectQueue.push({ start: newStep, sideCheckNumOp: { op: '*', number: cleanNum } })
    })
  }
  // now just add all the vars
  const letters = otherSide.match(/[+-]*[a-z]/gi)
  if (letters) {
    letters.forEach((letter) => {
      const cleanLetter = cleanString(cleanString(letter).replace('+-', '-').replace('+', ''))
      const newStep = `(${start})/1${cleanLetter}`
      collectQueue.push({ start: newStep, sideCheckNumOp: { op: '*', number: `1${cleanLetter}` } })
    })
  }

  const allEqualFn = (a: any, b: any) => a.start === b.start && a.sideCheckNumOp.op === b.sideCheckNumOp.op && a.sideCheckNumOp.number === b.sideCheckNumOp.number
  collectQueue = filterUniqueValues(collectQueue, (a, b) => allEqualFn(a, b))
  return collectQueue
}
