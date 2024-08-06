class UnionFind {
  constructor() {
    this.parent = new WeakMap()
    this.rank = new WeakMap()
    this.stringToObjectMap = new Map()
    this.objectId = new Map()
    this.nextId = 1
  }

  getObjectForString(str) {
    if (!this.stringToObjectMap.has(str))
      this.stringToObjectMap.set(str, {})

    return this.stringToObjectMap.get(str)
  }

  find(x) {
    x = typeof x === 'string' ? this.getObjectForString(x) : x
    if (this.parent.get(x) !== x)
      this.parent.set(x, this.find(this.parent.get(x))) // Path compression

    return this.parent.get(x)
  }

  union(x, y) {
    x = typeof x === 'string' ? this.getObjectForString(x) : x
    y = typeof y === 'string' ? this.getObjectForString(y) : y

    const rootX = this.find(x)
    const rootY = this.find(y)

    if (rootX !== rootY) {
      const rankX = this.rank.get(rootX) || 1
      const rankY = this.rank.get(rootY) || 1

      if (rankX > rankY) {
        this.parent.set(rootY, rootX)
      }
      else if (rankX < rankY) {
        this.parent.set(rootX, rootY)
      }
      else {
        this.parent.set(rootY, rootX)
        this.rank.set(rootX, rankX + 1)
      }
    }
  }

  add(x) {
    x = typeof x === 'string' ? this.getObjectForString(x) : x
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 1)
      if (!this.objectId.has(x))
        this.objectId.set(x, this.nextId++)
    }
  }

  getId(x) {
    x = typeof x === 'string' ? this.getObjectForString(x) : x
    return this.objectId.get(x)
  }
}

export class EqualityCache {
  constructor(equalsFunc) {
    this.equalsFunc = equalsFunc
    this.uf = new UnionFind()
  }

  areEqual(obj1, obj2) {
    this.uf.add(obj1)
    this.uf.add(obj2)

    const root1 = this.uf.find(obj1)
    const root2 = this.uf.find(obj2)

    if (root1 === root2) {
      // console.log('Cache used: Objects are already known to be equal.')
      return true
    }

    const result = this.equalsFunc(obj1, obj2)
    if (result) {
      this.uf.union(root1, root2)
      // console.log('Computed and cached: Objects found to be equal.')
    }
    else {
      // console.log('Computed: Objects are not equal.')
    }

    return result
  }
}

// Example usage:

// A complex equality function
// function complexEquals(node1, node2) {
//   return node1.value === node2.value
// }

// const cache = new EqualityCache(complexEquals)

// let obj1 = { value: 10 }
// let obj2 = { value: 10 }
// let obj3 = { value: 20 }
//
// console.log(cache.areEqual(obj1, obj2)) // true
// console.log(cache.areEqual(obj2, obj3)) // false
// console.log(cache.areEqual(obj1, obj3)) // false

// let obj4 = { value: 10 }
// console.log(cache.areEqual(obj2, obj4)) // true (and obj4 will be considered equal to obj1)
