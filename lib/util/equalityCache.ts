export class DisjointSet {
  private parent: Map<string, string>
  private rank: Map<string, number>

  constructor() {
    this.parent = new Map<string, string>()
    this.rank = new Map<string, number>() // To store the rank (or size) of each set
  }

  // Find the representative of the set containing x with path compression
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 0) // Initialize rank
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!))
    }
    return this.parent.get(x)!
  }

  // Union the sets containing x and y by rank
  union(x: string, y: string): void {
    const rootX = this.find(x)
    const rootY = this.find(y)

    if (rootX !== rootY) {
      const rankX = this.rank.get(rootX)!
      const rankY = this.rank.get(rootY)!

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

export class EqualityCache {
  private customEqualityFn: ((str1: string, str2: string) => boolean) | null
  private cache: DisjointSet

  constructor(customEqualityFn: ((str1: string, str2: string) => boolean) | null = null, cache: DisjointSet = new DisjointSet()) {
    this.customEqualityFn = customEqualityFn
    this.cache = cache
  }

  getFromCachedEquality(str1: string): string {
    return this.cache.find(str1)
  }

  getCachedEquality(str1: string, str2: string, customEqualityFn: ((str1: string, str2: string) => boolean) | null = this.customEqualityFn): boolean {
    const root1 = this.cache.find(str1)
    const root2 = this.cache.find(str2)

    if (root1 === root2)
      return true // They are in the same set, so they are equal

    // If not, compute the result using the custom function
    const result = customEqualityFn ? customEqualityFn(str1, str2) : false

    if (result) {
      // If they are equal, union their sets
      this.cache.union(str1, str2)
    }

    return result
  }
}
