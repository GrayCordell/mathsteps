import { describe, it } from 'vitest'
import { assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import type { AEquationChangeType } from '~/types/changeType/ChangeTypes'
import { assertObjectEqual, assertSpecifiedValues } from './util/assertHelpers'


const cleanMath = (str: string) => str?.replace('_', '').replace(' ', '').replace('[', '').replace(']', '').replace('\'', '').replace(`"`, '').replace('`', '')

type TestStep = Partial<StepInfo>
interface Test {
  description: string // Description of the test
  steps: string[] // The steps the user took. ['startingEquation', 'step1', 'step2', ...]
  // first array is the collection of entire steps
  // second array is the collection of steps that make up a user step
  //
  expectedAnalysis: {
    overallEval?: {
      reachesOriginalAnswer: boolean
      attemptedEquationChangeType?: AEquationChangeType
      equationErrorType?: AEquationChangeType
    }
    left: TestStep[]
    right: TestStep[]
  }[]
}
function testStepEvaluation(test: Test, index: number) {
  it(`test ${index + 1}: ${test.description}`, () => {
    let { steps, expectedAnalysis } = test
    steps = steps.map(cleanMath)

    const evaluatedSteps = assessUserEquationSteps(steps)
    for (let i = 0; i < expectedAnalysis.length; i++) {
      const leftExpected = expectedAnalysis[i].left
      const rightExpected = expectedAnalysis[i].right

      const leftAndRight = evaluatedSteps[i]
      for (let j = 0; j < leftExpected.length; j++) {
        const leftStepExpected = leftExpected[j]
        const rightStepExpected = rightExpected[j]
        const leftStep = leftAndRight.left[j]
        const rightStep = leftAndRight.right[j]
        if (!leftStep && leftStepExpected) {
          throw new Error(`You have more steps than expected ${JSON.stringify(leftExpected)}`)
        }
        if (!rightStep && rightStepExpected) {
          throw new Error(`You have more steps than expected. ${JSON.stringify(rightExpected)}`)
        }
        assertSpecifiedValues(leftStep, leftStepExpected)
        assertSpecifiedValues(rightStep, rightStepExpected)
      }

      // check overall checks
      assertObjectEqual({ ...leftAndRight }, expectedAnalysis[i].overallEval)
    }
  })
}
// from: x to: 2x to 3x = x->2x->3x
const makeToFromString = (strSplitByArrows: string) => {
  let split = strSplitByArrows.split('->').map(cleanMath).filter(val => val)
  if (split.length === 1)
    return [{ to: split[0] }]
  // else lets use the first element as the from
  // remove the first element
  split = split.slice(1)
  return split.map(cleanMath).map(val => ({ to: val }))
}
const l = (str: string) => ({ left: makeToFromString(str) })
const r = (str: string) => ({ right: makeToFromString(str) })
const reachesOgEqAnswer = (bool: boolean) => ({ overallEval: { reachesOriginalAnswer: bool } })
describe('assessUserEquationSteps2', () => {
  const tests: Test[] = [
    { // 1
      description: 'simple equation',
      steps: ['x+2=4', 'x=2'],
      expectedAnalysis: [
        { ...reachesOgEqAnswer(true), ...l('x+2->x+2-2->x+0->1x'), ...r('4->4-2->2') },
      ],
    },
    { // 2
      description: '2. 6*x=200->x=200/6',
      steps: ['6*x=200', 'x=200/6'],
      expectedAnalysis: [
        { ...reachesOgEqAnswer(true), ...l('6*x->6*x/6->1*x'), ...r('200->200/6') },
      ],
    },
  ]

  tests.forEach(testStepEvaluation)
})
