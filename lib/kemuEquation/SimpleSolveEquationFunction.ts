import mathsteps from '~/index'

/**
 * @param equation - The equation to solve either as a string or as an object with left and right properties.
 * @param variable - If null, the first letter found in the equation will be used.
 */
export function getNodeStepsToSolveEquation(equation: string | { left: string, right: string }, variable: string | null = null): {
  equation: {
    left: { type: string, node: any }
    right: { type: string, node: any }
  }
  equationString: string
}[] {
  if (typeof equation === 'object')
    equation = `${equation.left}=${equation.right}`

  const equationSteps: any[] = []
  const unknownVariable = variable ?? equation.toLowerCase().match(/[a-z]/i)?.[0] ?? 'x'
  /* const eventualAnswer = */ mathsteps.solveEquation(({
    equationAsText: equation,
    unknownVariable,
    onStepCb(step: any) {
      equationSteps.push({ ...step, equationString: step.equation.toString() })
      // console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`)
    },
  }))
  // console.log('equationSteps', equationSteps)
  return equationSteps
}


export function getFinalAnswerFromEquation(equation: string | { left: string, right: string }, variable: string | null = null): string {
  const steps = getNodeStepsToSolveEquation(equation, variable)
  return steps[steps.length - 1].equationString // The last step is the final answer
}


export function isEquationSolved(equation: string | { left: string, right: string }, variable: string | null = null): boolean {
  return getNodeStepsToSolveEquation(equation, variable).length === 0
}
