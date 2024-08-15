import { math } from '~/config.ts'
import NodeType from './Type.js'

const NodeCreator = {
  operator(op, args, implicit = false) {
    if ((args.length === 1) && '*+'.includes(op))
      return args[0]

    switch (op) {
      case '+':
        return new math.OperatorNode('+', 'add', args)
      case '-':
        return new math.OperatorNode('-', 'subtract', args)
      case '/':
        return new math.OperatorNode('/', 'divide', args)
      case '*':
        return new math.OperatorNode('*', 'multiply', args, implicit)
      case '^':
        return new math.OperatorNode('^', 'pow', args)
      default:
        throw new Error(`Unsupported operation: ${op}`)
    }
  },
  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus(content) {
    let rv = null
    if (NodeType.isConstant(content)) {
      // -c : just multiply constant by -1
      rv = new math.ConstantNode(math.multiply(math.bignumber(content.value), -1))
    }
    else {
      // Default scenario - wrap into unaryMinus() function.
      rv = new math.OperatorNode('-', 'unaryMinus', [content])
    }
    return rv
  },
  constant(val) {
    if (typeof (val) === 'number')
      val = math.bignumber(val)

    return new math.ConstantNode(val)
  },
  symbol(name) {
    return new math.SymbolNode(name)
  },
  parenthesis(content) {
    return new math.ParenthesisNode(content)
  },
  list(content) {
    return new math.ArrayNode(content)
  },
  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the base node can never be null.
  term(base, exponent, coeff, explicitCoeff = false) {
    let term = base
    if (exponent)
      term = this.operator('^', [term, exponent])

    if (coeff && (explicitCoeff || math.unequal(coeff.value, 1))) {
      if (NodeType.isConstant(coeff)
        && math.equal(coeff.value, -1)
        && !explicitCoeff) {
        // if you actually want -1 as the coefficient, set explicitCoeff to true
        term = this.unaryMinus(term)
      }
      else {
        term = this.operator('*', [coeff, term], true)
      }
    }
    return term
  },
  polynomialTerm(symbol, exponent, coeff, explicitCoeff = false) {
    return this.term(symbol, exponent, coeff, explicitCoeff)
  },
  // Given a root value and a radicand (what is under the radical)
  nthRoot(radicandNode, rootNode) {
    if (rootNode && !NodeType.kemuIsConstantInteger(rootNode, 2)) {
      // Root of n degree.
      return new math.FunctionNode(NodeCreator.symbol('nthRoot'), [radicandNode, rootNode])
    }
    else {
      // Root of 2 degree, fallback to sqrt.
      return new math.FunctionNode(NodeCreator.symbol('sqrt'), [radicandNode])
    }
  },
  kemuCreateAbs(node) {
    const symbol = NodeCreator.symbol('abs')
    return new math.FunctionNode(symbol, [node])
  },
  kemuCreateSqrt(node) {
    const symbol = NodeCreator.symbol('sqrt')
    return new math.FunctionNode(symbol, [node])
  },
  kemuCreateBuiltInConstant(name) {
    // Possible improvement: Limit pool of known constants?
    const objectNode = new math.SymbolNode('const')
    const indexNode = new math.IndexNode([new math.ConstantNode(name)], true)
    return new math.AccessorNode(objectNode, indexNode)
  },
  percent(node) {
    return new math.FunctionNode('percent', [node])
  },
  kemuCreateByFn(fn, args) {
    switch (fn) {
      case 'add': return NodeCreator.operator('+', args)
      case 'subtract': return NodeCreator.operator('-', args)
      case 'multiply': return NodeCreator.operator('*', args)
      case 'divide': return NodeCreator.operator('/', args)
      case 'pow': return NodeCreator.operator('^', args)
      case 'unaryMinus': return NodeCreator.unaryMinus(args)
      default: {
        // eslint-disable-next-line no-throw-literal
        throw `kemuCreateByFn: error: unknown fn: ${fn}`
      }
    }
  },
}
export default NodeCreator
