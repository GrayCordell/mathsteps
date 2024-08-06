const MAX_VALUE = 4096
const MAX_N = 16

const nthRootLUT = {}

function insertEntry(value, p, q, n) {
  if ((value < MAX_VALUE)) {
    const bucket = nthRootLUT[n] || {}
    bucket[value] = [p, q]
    nthRootLUT[n] = bucket
  }
}

for (let n = 2; n < MAX_N; n++) {
  const MAX_PQ = Number.parseInt(MAX_VALUE ** (1 / n))

  for (let p = 2; p < MAX_PQ; p++) {
    const value = p ** n

    // Imperfect roots: nthRoot(p^n * q, n)
    for (let q = 2; q < MAX_PQ; q++)
      insertEntry(value * q, p, q, n)

    // Perfect roots: nthRoot(p^n, n) = p
    insertEntry(value, p, 0, n)
  }
}

console.log(nthRootLUT)
