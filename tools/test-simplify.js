import mathsteps from '~/index'

const expr = '(x - 2)^2'
const exprObj = mathsteps.parseText(expr)

console.log('--------------------------')
console.log('BEFORE')
console.log('NODE:', exprObj)
console.log('Ascii:', mathsteps.print(exprObj))
console.log('LaTeX:', mathsteps.printAsTeX(exprObj))
console.log()

console.log('--------------------------')
console.log('STEPS')

const newNode = mathsteps.simplifyExpression({
  expressionAsText: expr,
  onStepCb: (stepMeta) => {
    console.log(stepMeta.changeType, '|', mathsteps.print(stepMeta.rootNode))

    /*
    if (stepMeta.altForms) {
      console.log('ALT FORM:', mathsteps.printAsTeX(stepMeta.altForms[0].node))
      console.log(stepMeta.altForms[0].node)
    }
    */
  },
})

console.log()
console.log('--------------------------')
console.log('AFTER')
console.log('NODE:', newNode)
console.log('Ascii:', mathsteps.print(newNode))
console.log('LaTeX:', mathsteps.printAsTeX(newNode))
