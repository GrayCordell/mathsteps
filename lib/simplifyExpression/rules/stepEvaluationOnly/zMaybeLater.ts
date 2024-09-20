// import {filterUniqueValues} from '~/util/arrayUtils'
// import {diffWords} from 'diff'
//
// function findCountsThatHaveChanged(_from: Term[], _to: Term[]) {
//  const unqFrom = filterUniqueValues(_from, (a, b) => a.value === b.value)
//  const unqTo = filterUniqueValues(_to, (a, b) => a.value === b.value)
//
//  const removedValues = []
//  const addedValues = []
//  const unchangedValues = []
//
//  // Check for removed or unchanged values in 'from'
//  for (const fromTerm of unqFrom) {
//    const toTerm = unqTo.find(term => term.value === fromTerm.value)
//    const toTermCount = toTerm?.count ?? 0
//    const countDiff = toTermCount - (fromTerm.count ?? 0)
//
//    if (countDiff < 0) {
//      removedValues.push({ value: fromTerm.value, countDiff })
//    }
//    else if (countDiff > 0) {
//      addedValues.push({ value: toTerm!.value, countDiff })
//    }
//    else {
//      unchangedValues.push(fromTerm)
//    }
//  }
//
//
//  // Check for newly added values in 'to' that are not in 'from'
//  for (const toTerm of unqTo) {
//    const fromTerm = unqFrom.find(term => term.value === toTerm.value)
//
//    if (!fromTerm) {
//      addedValues.push({ value: toTerm.value, countDiff: toTerm.count })
//    }
//  }
//
//  let totalRemoved = removedValues.reduce((acc, { countDiff }) => acc + countDiff, 0)
//  // make not negative
//  totalRemoved = totalRemoved < 0 ? totalRemoved * -1 : totalRemoved
//
//  const totalAdded = addedValues.reduce((acc, { countDiff }) => acc + (countDiff ?? 0), 0)
//
//  return { totalRemoved, totalAdded, removedValues, addedValues, unchangedValues }
// }
//
// function diffCheckUsingStringDiff(from: string, to: string) {
//  // return null if it has variables subtraction or division
//  if (/[a-zA-Z]/.test(from) || /[a-zA-Z]/.test(to) || from.includes('/') || to.includes('/') || from.includes('-') || to.includes('-'))
//    return
//  from = from.replace(/ /g, '')
//  to = to.replace(/ /g, '')
//  const diff = diffWords(from, to, { ignoreCase: true })
//  const removed = []
//  const added = []
//  const unchanged = []
//  for (const part of diff) {
//    if (part.removed) {
//      const removedPart = part.value
//      const opsFound = removedPart.match(/(\+|\*)/g)
//      if (opsFound?.length ?? 0 > 1)
//        return
//      const op = opsFound?.[0] || ''
//      if (op)
//        removed.push(op)
//      removed.push(removedPart.replace(op, ''))
//    }
//    if (part.added) {
//      const newPart = part.value
//      const opsFound = newPart.match(/(\+|\*)/g)
//      if (opsFound?.length ?? 0 > 1)
//        return
//      const op = opsFound?.[0] || ''
//      if (op)
//        added.push(op)
//      added.push(newPart.replace(op, ''))
//    }
//    if (!part.added && !part.removed) {
//      const unchangedPart = part.value
//      const opsFound = unchangedPart.match(/(\+|\*)/g)
//      if (opsFound?.length ?? 0 > 1)
//        return
//      const op = opsFound?.[0] || ''
//      if (op)
//        unchanged.push(op)
//      unchanged.push(unchangedPart.replace(op, ''))
//    }
//  }
//  return { removed, added, unchanged }
// }
