export function generatePermutations(arr) {
  const results = []
  function heapPermute(n) {
    if (n === 1) {
      results.push(arr.slice())
      return
    }
    for (let i = 0; i < n; i++) {
      heapPermute(n - 1)
      // Swap logic depending on n being odd or even
      if (n % 2 === 0)
        [arr[i], arr[n - 1]] = [arr[n - 1], arr[i]] // Swap for even n

      else
        [arr[0], arr[n - 1]] = [arr[n - 1], arr[0]] // Swap for odd n
    }
  }
  heapPermute(arr.length)
  return results
}
export function generateCombinations(arr) {
  const combinations = []
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      // Get the pair of numbers
      const pair = [arr[i], arr[j]]
      // Get the remaining numbers excluding the current pair
      const remaining = arr.filter((_, index) => index !== i && index !== j)
      // Combine pair with the remaining numbers
      combinations.push([...pair, ...remaining])
    }
  }
  return combinations
}
export function filterUniqueValues(arr, isEqual = (a, b) => a === b) {
  const uniqueArray = []
  const seen = new Map()
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    let isUnique = true
    // eslint-disable-next-line no-unused-vars
    for (const [key, _value] of seen) {
      if (isEqual(current, key)) {
        isUnique = false
        break
      }
    }
    if (isUnique) {
      uniqueArray.push(current)
      seen.set(current, true) // Store the value as a key in the Map
    }
  }
  return uniqueArray
}
