export const fParenX_EQ_WParenX = {
  id: 'fParenX_EQ_WParenX',
  pattern: 'f(x)=W(x)',
  solveFunction: (equation) => {
    // Apply common rules.
    const poolOfRules = [
      // Common rules.
      { l: 'EQ(fx1 , fx)', r: 'EQ(fx1 - fx, 0)', id: 'mov_fx_to_left' },
    ]
    equation.applyRules(poolOfRules, {
      simplifyBeforeEachStepEnabled: false,
    })
  },
}
