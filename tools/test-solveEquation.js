import mathsteps from '~/index'

const result = mathsteps.solveEquation({
  equationAsText: 'x/(2/3) = 1',
  unknownVariable: 'x',
  onStepCb(step) {
    console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
  },
})

console.log('SOLUTIONS', result.getSolutionsAsText())
