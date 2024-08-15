import { all, create } from 'mathjs'

// change the default mathjs configuration.
// We want to store all constants as big number.
const math = create(all, {
  epsilon: 1e-12,
  matrix: 'Matrix',
  number: 'BigNumber',
  precision: 64,
  predictable: false,
  randomSeed: null,
})
export { math }
export default {
  math,
}
