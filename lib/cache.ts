import { LRUCache } from 'lru-cache'
// TODO All caches will slowly be migrated here.

export const MyNodeToStringCache = new LRUCache({
  max: 5000, // Maximum number of items in the cache
  ttl: 1000 * 60 * 10, // Time-to-live in milliseconds (10 minutes)
  updateAgeOnGet: true, // Refresh TTL on access
  updateAgeOnHas: true, // Refresh TTL on set
  allowStale: false, // Do not return stale items
  // dispose: (key: any, value: any) => {
  //  console.log(`Evicted cache key: ${key}`)
  //  // Optional cleanup logic
  // },

  maxSize: 5000, // Maximum size of the cache in storage
  sizeCalculation: (value: string | unknown[]) => value.length, // Use string length as size
})

// export const ApplyRuleCache = new LRUCache({
//  max: 5000, // Maximum number of items in the cache
//  ttl: 1000 * 60 * 10, // Time-to-live in milliseconds (10 minutes)
//  updateAgeOnGet: true, // Refresh TTL on access
//  allowStale: false, // Do not return stale items
//  // dispose: (key: any, value: any) => {
//  //  console.log(`Evicted cache key: ${key}`)
//  //  // Optional cleanup logic
//  // },
//  sizeCalculation: (value: { changeType: any, rootNode: any, mistakes: any, isMistake: any } | null, key: any) => {
//  },
// })
