import EquationSolverCore from '~/kemuEquation/EquationSolverCore.js'

import { C_EQ_C } from './solveProviders/C_EQ_C.js'
import { WparenxEQ_C } from '~/kemuEquation/solveProviders/W(x)_EQ_C.js'
import { fParenX_EQ_C } from '~/kemuEquation/solveProviders/f(x)_EQ_C.js'
import { fParenX_EQ_WParenX } from '~/kemuEquation/solveProviders/f(x)_EQ_W(x).js'
import { WParenX_EQ_WParenX } from '~/kemuEquation/solveProviders/W(x)_EQ_W(x).js'

export const eqSolver0 = new EquationSolverCore()

function registerSolveFunction(eqSolver, solveProvider) {
  // eslint-disable-next-line unused-imports/no-unused-vars,no-unused-vars
  const { id, pattern, solveFunction } = solveProvider
  eqSolver.registerSolveFunction(pattern, equation => solveFunction(equation, eqSolver, eqSolver))
}

registerSolveFunction(eqSolver0, C_EQ_C)
registerSolveFunction(eqSolver0, fParenX_EQ_C)
registerSolveFunction(eqSolver0, WparenxEQ_C)
registerSolveFunction(eqSolver0, fParenX_EQ_WParenX)
registerSolveFunction(eqSolver0, WParenX_EQ_WParenX)

export default eqSolver0
