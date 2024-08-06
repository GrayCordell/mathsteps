import Node from '../node/index.js'

class EquationTerm {
  constructor(type, node, data) {
    this.type = type
    this.node = node
    this.data = data
  }

  static createConstant(node) {
    return new EquationTerm('constant', node)
  }

  static createPolynomial(node) {
    return new EquationTerm('polynomial', node)
  }

  static createFunction(node) {
    return new EquationTerm('function', node)
  }

  static operator2(op, a, b) {
    const arithmeticMap = {
      // C op C
      'constant+constant': 'constant',
      'constant-constant': 'constant',
      'constant*constant': 'constant',
      'constant/constant': 'constant',
      'constant^constant': 'constant',
      // W(x) op W(x)
      'polynomial+polynomial': 'polynomial',
      'polynomial-polynomial': 'polynomial',
      'polynomial*polynomial': 'function',
      'polynomial/polynomial': 'function',
      'polynomial^polynomial': 'function',
      // W(x) op C
      'polynomial+constant': 'polynomial',
      'polynomial-constant': 'polynomial',
      'polynomial*constant': 'polynomial',
      'polynomial/constant': 'polynomial',
      'polynomial^constant': function (a, _b) {
        let rv = null
        if (Node.Type.isSymbol(a.node)) {
          // W1(x)^n = x^n
          // just emit another polynomial term.
          rv = 'polynomial'
        }
        else {
          // Wn(x)^n = f(x)
          // General case, treat as f(x).
          rv = 'function'
        }
        return rv
      },
      // C op W(x)
      'constant+polynomial': 'polynomial',
      'constant-polynomial': 'polynomial',
      'constant*polynomial': 'polynomial',
      'constant/polynomial': 'function',
      'constant^polynomial': 'function',
    }
    const newNode = Node.Creator.operator(op, [a.node, b.node])
    const hash = a.type + op + b.type
    let newType = null
    if ((a.type === 'function') || (b.type === 'function')) {
      newType = 'function'
    }
    else {
      const newTypeOrFct = arithmeticMap[hash]
      if (typeof newTypeOrFct === 'function')
        newType = newTypeOrFct(a, b)

      else
        newType = newTypeOrFct
    }
    if (newType == null)
      throw new Error(`unhandled node types:${hash}`)

    // TODO: Handle data?
    // TODO: Handle polynomial degree?
    return new EquationTerm(newType, newNode)
  }

  static add(a, b) {
    return EquationTerm.operator2('+', a, b)
  }

  static sub(a, b) {
    return EquationTerm.operator2('-', a, b)
  }

  static mul(a, b) {
    return EquationTerm.operator2('*', a, b)
  }

  static div(a, b) {
    return EquationTerm.operator2('/', a, b)
  }

  static pow(a, b) {
    return EquationTerm.operator2('^', a, b)
  }

  static neg(a) {
    const newNode = Node.Creator.unaryMinus(a.node)
    return new EquationTerm(a.type, newNode)
  }

  toString() {
    const typeToText = {
      constant: 'C',
      polynomial: 'W(x)',
      function: 'f(x)',
    }
    return typeToText[this.type]
  }
}
export default EquationTerm
