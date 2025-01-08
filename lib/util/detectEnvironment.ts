/* eslint-disable node/prefer-global/process,no-restricted-globals */

export const detectEnvironmentAndMode = () => {
  // Check for Node.js
  const isNode = typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null

  // Check for Browser
  const isBrowser = typeof window !== 'undefined'
    && typeof window.document !== 'undefined'

  // Check for Web Worker
  const isWebWorker = typeof self === 'object'
    && self.constructor
    && self.constructor.name === 'DedicatedWorkerGlobalScope'

  // Check for Vite
  const isVite = typeof import.meta !== 'undefined'
    && import.meta.env != null
    && import.meta.env.MODE != null

  // Check for Electron
  const isElectron = typeof process !== 'undefined'
    && process.versions != null
    && process.versions.electron != null

  // Check for React Native
  const isReactNative = typeof navigator !== 'undefined'
    && navigator.product === 'ReactNative'

  // Detect if in development mode
  const isDevelopment = Boolean(
    (isNode && process.env.NODE_ENV === 'development') // Node.js
    || (isVite && import.meta.env.MODE === 'development') // Vite
    // @ts-expect-error ---
    || (isBrowser && typeof window.__DEV__ !== 'undefined' && window.__DEV__) // Custom Browser Flag
    || (isElectron && process.env.NODE_ENV === 'development') // Electron
    || false, // Default
  )

  return {
    isNode,
    isBrowser,
    isWebWorker,
    isVite,
    isElectron,
    isReactNative,
    isDevelopment,
  }
}

// Use the detection function
export const detectedEnvAndModes = detectEnvironmentAndMode()
