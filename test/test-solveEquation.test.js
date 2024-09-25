import { assert, describe, it } from 'vitest'
import mathsteps from '~/index'


const result = mathsteps.solveEquation({
  equationAsText: 'x/(2/3) = 1',
  unknownVariable: 'x',
  onStepCb(step) {
    console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
  },
})

describe('solveEquation for =', () => {
  it('x/(2/3) = 1 -> x = 2/3', () => {
    const solutions = result.getSolutionsAsText()
    console.log('SOLUTIONS', solutions)
    assert.equal(solutions, 'x = 2/3')
  })
})
