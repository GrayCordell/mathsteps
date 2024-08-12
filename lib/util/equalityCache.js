export class DisjointSet {
  constructor() {
    this.parent = new Map()
    this.rank = new Map() // To store the rank (or size) of each set
  }

  // Find the representative of the set containing x with path compression
  find(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 0) // Initialize rank
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)))
    }
    return this.parent.get(x)
  }

  // Union the sets containing x and y by rank
  union(x, y) {
    const rootX = this.find(x)
    const rootY = this.find(y)

    if (rootX !== rootY) {
      const rankX = this.rank.get(rootX)
      const rankY = this.rank.get(rootY)

      if (rankX > rankY) {
        this.parent.set(rootY, rootX)
      }
      else if (rankX < rankY) {
        this.parent.set(rootX, rootY)
      }
      else {
        this.parent.set(rootY, rootX)
        this.rank.set(rootX, rankX + 1) // Increment rank if both roots have the same rank
      }
    }
  }
}
export const equalityCache = new DisjointSet()

export function getFromCachedEquality(str1) {
  const root1 = equalityCache.find(str1)
  return root1
}

// Cache to store results using DisjointSet for transitive equality
// export const equalityCache = new DisjointSet()

export function getCachedEquality(str1, str2, customEqualityFn) {
  const root1 = equalityCache.find(str1)
  const root2 = equalityCache.find(str2)

  if (root1 === root2) {
    return true // They are in the same set, so they are equal
  }

  // If not, compute the result using the custom function
  const result = customEqualityFn(str1, str2)

  if (result) {
    // If they are equal, union their sets
    equalityCache.union(str1, str2)
  }

  return result
}
