export function generatePermutations<T>(arr: T[]): T[][] {
  const results: T[][] = []
  function heapPermute(n: number): void {
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
export function generateCombinations<T>(arr: T[]): T[][] {
  const combinations: T[][] = []
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      // Get the pair of elements
      const pair: T[] = [arr[i], arr[j]]
      // Get the remaining elements excluding the current pair
      const remaining: T[] = arr.filter((_, index) => index !== i && index !== j)
      // Combine pair with the remaining elements
      combinations.push([...pair, ...remaining])
    }
  }
  return combinations
}

export function filterUniqueValues<T>(arr: T[], isEqual: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
  const uniqueArray: T[] = []
  const seen = new Map<T, boolean>()
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    let isUnique = true
    for (const key of seen.keys()) {
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
