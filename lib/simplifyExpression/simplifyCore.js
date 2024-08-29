/* eslint-disable no-throw-literal,style/no-mixed-operators */
import { math } from '~/config'
import Node from '../node/index.js'
import { parseText } from '~/index'
import { createMakeNodeFunction, flatten, hasOwnProperty, isAssociative, isCommutative, isConstantNode, resolve, unflattenl, unflattenr } from '~/simplifyExpression/utilMadeFromMathJs.js'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import ChangeTypes from '~/types/ChangeTypes'

const SymbolNode = math.SymbolNode
const OperatorNode = math.OperatorNode
const FunctionNode = math.FunctionNode
const AccessorNode = math.AccessorNode
const ConstantNode = math.ConstantNode
const equal = math.equal

// We compile rules once and keep them for further reuse.
const RULES_CACHE = new Map()
function _typeof(obj) {
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    // eslint-disable-next-line no-func-assign
    _typeof = function _typeof(obj) {
      return typeof obj
    }
  }
  else {
    // eslint-disable-next-line no-func-assign
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj
    }
  }
  return _typeof(obj)
}
let _lastsym = 0

/* const simplifyCache = new Map()
function makeKeyForSimplifyCache(expr, rules, scope, options) {
  const exprStr = makeKeyFromNode(expr)
  const rulesKeyPart = rules.map(rule => rule.id || rule.name).join('|')
  const scopePart = scope && Object.values(scope).length > 0 ? JSON.stringify(scope) : 'noScope'
  const optionsPart = options && Object.values(options).length > 0 ? JSON.stringify(options) : 'noOptions'
  return `${exprStr}|${rulesKeyPart}|${scopePart}|${optionsPart}`
  // return `${exprStr}|${rulesKeyPart}|${scopePart}|${optionsPart}`
} */

/**
 * Simplify an expression tree.
 *
 * A list of rules are applied to an expression, repeating over the list until
 * no further changes are made.
 * It's possible to pass a custom set of rules to the function as second
 * argument. A rule can be specified as an object, string, or function:
 *
 *     const rules = [
 *       { l: 'n1*n3 + n2*n3', r: '(n1+n2)*n3' },
 *       'n1*n3 + n2*n3 -> (n1+n2)*n3',
 *       function (node) {
 *         // ... return a new node or return the node unchanged
 *         return node
 *       }
 *     ]
 *
 * String and object rules consist of a left and right pattern. The left is
 * used to match against the expression and the right determines what matches
 * are replaced with. The main difference between a pattern and a normal
 * expression is that variables starting with the following characters are
 * interpreted as wildcards:
 *
 * - 'n' - matches any Node
 * - 'c' - matches any ConstantNode
 * - 'v' - matches any Node that is not a ConstantNode
 *
 * The default list of rules is exposed on the function as `simplify.rules`
 * and can be used as a basis to built a set of custom rules.
 *
 * For more details on the theory, see:
 *
 * - [Strategies for simplifying math expressions (Stackoverflow)](https://stackoverflow.com/questions/7540227/strategies-for-simplifying-math-expressions)
 * - [Symbolic computation - Simplification (Wikipedia)](https://en.wikipedia.org/wiki/Symbolic_computation#Simplification)
 *
 *  An optional `options` argument can be passed as last argument of `simplify`.
 *  There is currently one option available: `exactFractions`, a boolean which
 *  is `true` by default.
 *
 * Syntax:
 *
 *     simplify(expr)
 *     simplify(expr, rules)
 *     simplify(expr, rules)
 *     simplify(expr, rules, scope)
 *     simplify(expr, rules, scope, options)
 *     simplify(expr, scope)
 *     simplify(expr, scope, options)
 *
 * Examples:
 *
 *     math.simplify('2 * 1 * x ^ (2 - 1)')      // Node '2 * x'
 *     math.simplify('2 * 3 * x', {x: 4})        // Node '24'
 *     const f = math.parse('2 * 1 * x ^ (2 - 1)')
 *     math.simplify(f)                          // Node '2 * x'
 *     math.simplify('0.4 * x', {}, {exactFractions: true})  // Node 'x * 2 / 5'
 *     math.simplify('0.4 * x', {}, {exactFractions: false}) // Node '0.4 * x'
 *
 * See also:
 *
 *     derivative, parse, evaluate, rationalize
 *
 * @param {Node | string} expr
 *            The expression to be simplified
 * @param {Array<{l: string, r: string} | string | Function>} [_rules]
 *            Optional list with custom rules
 * @param scope
 * @param options
 * @return {Node} Returns the simplified form of `expr`
 */
function simplify(expr, _rules, scope, options) {
  // const key = makeKeyForSimplifyCache(expr, rules, scope, options)
  // if (simplifyCache.has(key)) {
  //   return simplifyCache.get(key)
  // }

  const steps = []
  const rules = buildRulesAndMistakeRules(_rules, scope, options)

  let res = resolve(expr)
  const visited = {}

  let str = myNodeToString(res, { parenthesis: 'all' })
  let newRes = null
  options = options || {}
  while (!visited[str]) {
    visited[str] = true
    _lastsym = 0 // counter for placeholder symbols
    for (let i = 0; i < rules.length; i++) {
      if (typeof rules[i] === 'function') {
        newRes = rules[i](res, options)
      }
      else {
        flatten(res)
        // handle full mistakes, which are the rules with mistakeL
        if (rules[i].isMistake) {
          let builtMistakes = []
          for (const mistakeRule of rules[i].mistakes) {
            builtMistakes.push(applyRule(res, mistakeRule, scope, options))
          }
          builtMistakes = builtMistakes.filter(m => m).map(m => ({ ...m, isMistake: true }))
          const firstMistake = builtMistakes.find(m => m)
          newRes = { ...firstMistake, mistakes: builtMistakes, isMistake: true }
        }
        else {
          newRes = applyRule(res, rules[i], scope, options)
        }
      }
      // handle normal rule+mistakes here, which are the mistakeRules that don't specify a mistakeL
      if (newRes && !rules[i].mistakeL && rules[i].mistakes && options.getMistakes) {
        const mistakeReses = []
        for (const mistakeRule of rules[i].mistakes) {
          const ruleToUse = {
            ...rules[i],
            // r: mistakeRule?.r,
            l: rules[i].l,
            replaceFct: mistakeRule.replaceFct,
          }
          const mistakeResponse = applyRule(res, ruleToUse, scope, options)
          if (mistakeResponse)
            mistakeReses.push({ ...mistakeResponse, ruleApplied: { id: mistakeRule.id } })
        }
        newRes.mistakes = mistakeReses
      }

      if (newRes) {
        steps.push(newRes)

        // TODO Had to change it to ChangeTypes only for some reason. Look at error - ['2/(4x) = 1', 'x = 1/2'] when off. I believe it has something to do with evaluateEquation type rules
        const foundNewResIdInChangeTypes = Object.values(ChangeTypes).includes(newRes.ruleApplied?.id)
        if (options.stopOnFirstStep && foundNewResIdInChangeTypes) {
          return steps
        }
        res = newRes.nodeAfter
        unflattenl(res) // using left-heavy binary tree here since custom rule functions may expect it
      }
    }
    str = myNodeToString(res, { parenthesis: 'all' })
  }

  // simplifyCache.set(key, steps)
  return steps
}
const SUPPORTED_CONSTANTS = {
  true: true,
  false: true,
  e: true,
  i: true,
  Infinity: true,
  LN2: true,
  LN10: true,
  LOG2E: true,
  LOG10E: true,
  NaN: true,
  phi: true,
  pi: true,
  SQRT1_2: true,
  SQRT2: true,
  tau: true, // null: false,
  // undefined: false,
  // version: false,
  // Array of strings, used to build the ruleSet.
  // Each l (left side) and r (right side) are parsed by
  // the expression parser into a node tree.
  // Left hand sides are matched to subtrees within the
  // expression to be parsed and replaced with the right
  // hand side.
  // TODO: Add support for constraints on constants (either in the form of a '=' expression or a callback [callback allows things like comparing symbols alphabetically])
  // To evaluate lhs constants for rhs constants, use: { l: 'c1+c2', r: 'c3', evaluate: 'c3 = c1 + c2' }. Multiple assignments are separated by ';' in block format.
  // It is possible to get into an infinite loop with conflicting rules
}
function _preprocessRuleNode(node) {
  if (Node.Type.isUnaryMinus(node)
    && Node.Type.isSymbol(node.args[0]) && (node.args[0].name[0] === 'c')) {
    // Negative constant node: -c.
    // Encode negative sign as flag to make nodes match simpler.
    node = node.args[0]
    node.isNegative = true
  }
  else {
    // Non constant-node. Go on recurisively if possible.
    if (node.args) {
      node.args.forEach((childNode, idx) => {
        node.args[idx] = _preprocessRuleNode(childNode)
      })
    }
  }
  return node
}

/**
 * Parse the string array of rules into nodes
 *
 * Example syntax for rules:
 *
 * Position constants to the left in a product:
 * { l: 'n1 * c1', r: 'c1 * n1' }
 * n1 is any Node, and c1 is a ConstantNode.
 *
 * Apply difference of squares formula:
 * { l: '(n1 - n2) * (n1 + n2)', r: 'n1^2 - n2^2' }
 * n1, n2 mean any Node.
 *
 * Short hand notation:
 * 'n1 * c1 -> c1 * n1'
 */
// eslint-disable-next-line unused-imports/no-unused-vars
function _buildRules(_rules, scope, options) {
  const rules = _rules.filter(rule => !rule.mistakeL)
  if (rules.length === 0)
    return []

  let ruleSet = RULES_CACHE.get(rules)
  if (!ruleSet) {
    // Possible improvement: cache rules.
    // Array of rules to be used to simplify expressions
    ruleSet = []
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i]
      let newRule = void 0
      const ruleType = _typeof(rule)
      switch (ruleType) {
        case 'string':
        {
          const lr = rule.split('->')
          if (lr.length === 2) {
            rule = {
              l: lr[0],
              r: lr[1],
            }
          }
          else {
            throw new SyntaxError(`Could not parse rule: ${rule}`)
          }
        }
        /* falls through */
        case 'object': {
          const ruleLeft = rule.l
          const ruleRight = rule.replaceFct ? '_rv' : rule.r
          newRule = {
            l: parseText(ruleLeft),
            r: parseText(ruleRight),
            mistakes: rule.mistakes,
            id: rule.id,
            replaceFct: rule.replaceFct,
          }
          _preprocessRuleNode(newRule.l)
          if (rule.context)
            newRule.evaluate = rule.context

          if (rule.evaluate)
            newRule.evaluate = parseText(rule.evaluate)

          if (isAssociative(newRule.l)) {
            const makeNode = createMakeNodeFunction(newRule.l)
            const expandsym = _getExpandPlaceholderSymbol()
            newRule.expanded = {}
            newRule.expanded.l = makeNode([newRule.l.clone(), expandsym]) // Push the expandsym into the deepest possible branch.
            // This helps to match the newRule against nodes returned from getSplits() later on.
            flatten(newRule.expanded.l)
            unflattenr(newRule.expanded.l)
            newRule.expanded.r = makeNode([newRule.r, expandsym])
          }
          break
        }
        case 'function': {
          newRule = rule
          break
        }
        default: {
          throw new TypeError(`Unsupported type of rule: ${ruleType}`)
        }
      }
      ruleSet.push(newRule)
    }
    // Cache precompiled rules for further use.
    RULES_CACHE.set(rules, ruleSet)
  }
  // Verify rules.
  if (rules[0].id !== ruleSet[0].id) {
    console.log('rule[0]   :', rules[0])
    console.log('ruleSet[0]:', { l: ruleSet[0].l.toString(), r: ruleSet[0].r.toString(), id: ruleSet[0].id })
    throw 'error: bad rule set'
  }
  return ruleSet
}
function _getExpandPlaceholderSymbol() {
  return new SymbolNode(`_p${_lastsym++}`)
}

/**
 * Returns a simplfied form of node, or the original node if no simplification was possible.
 *
 * @param  {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} node
 * @return {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} The simplified form of `expr`, or the original node if no simplification was possible.
 */
function applyRule(node, rule, scope, options) {
  let rv = null
  // console.log('Entering applyRule(' + node.toString() + ')')
  // Do not clone node unless we find a match
  let res = node // First replace our child nodes with their simplified versions
  // If a child could not be simplified, the assignments will have
  // no effect since the node is returned unchanged
  // Try to match a rule against this node
  let repl = rule.r
  let matches = _ruleMatch(rule.l, res, false, scope, options)[0] // If the rule is associative operator, we can try matching it while allowing additional terms.

  // This allows us to match rules like 'n+n' to the expression '(1+x)+x' or even 'x+1+x' if the operator is commutative.
  if (!matches && rule.expanded) {
    repl = rule.expanded.r
    matches = _ruleMatch(rule.expanded.l, res, false, scope, options)[0]
  }
  if (matches) {
    // const before = res.toString({parenthesis: 'all'})
    // Create a new node by cloning the rhs of the matched rule
    // we keep any implicit multiplication state if relevant
    const implicit = res.implicit
    res = repl.clone()
    if (implicit && 'implicit' in repl)
      res.implicit = true
    // Replace placeholders with their respective nodes without traversing deeper into the replaced nodes
    if (rule.replaceFct)
      matches.placeholders._rv = rule.replaceFct(node, matches.placeholders)

    res = res.transform((node) => {
      if (node.isSymbolNode && (0, hasOwnProperty)(matches.placeholders, node.name))
        return matches.placeholders[node.name].clone()

      else
        return node
    })
    rv = {
      ruleApplied: rule,
      nodeBefore: node,
      nodeAfter: res,
      matches,
    }
  }

  // rv.mRv = mRv
  return rv

  // Original was:
  // return res;
}

/**
 * Get (binary) combinations of a flattened binary node
 * e.g. +(node1, node2, node3) -> [
 *        +(node1,  +(node2, node3)),
 *        +(node2,  +(node1, node3)),
 *        +(node3,  +(node1, node2))]
 *
 */
function getSplits(node, context) {
  const res = []
  let right, rightArgs
  const makeNode = createMakeNodeFunction(node)
  if (isCommutative(node, context)) {
    for (let i = 0; i < node.args.length; i++) {
      rightArgs = node.args.slice(0)
      rightArgs.splice(i, 1)
      right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
      res.push(makeNode([node.args[i], right]))
    }
  }
  else {
    rightArgs = node.args.slice(1)
    right = rightArgs.length === 1 ? rightArgs[0] : makeNode(rightArgs)
    res.push(makeNode([node.args[0], right]))
  }
  return res
}
/**
 * Returns the set union of two match-placeholders or null if there is a conflict.
 */
function mergeMatch(match1, match2) {
  const res = {
    placeholders: {}, // Some matches may not have placeholders; this is OK
  }
  if (!match1.placeholders && !match2.placeholders)
    return res

  else if (!match1.placeholders)
    return match2

  else if (!match2.placeholders)
    return match1
  // Placeholders with the same key must match exactly
  for (const key in match1.placeholders) {
    res.placeholders[key] = match1.placeholders[key]
    if ((0, hasOwnProperty)(match2.placeholders, key)) {
      if (!_exactMatch(match1.placeholders[key], match2.placeholders[key]))
        return null
    }
  }
  for (const _key in match2.placeholders)
    res.placeholders[_key] = match2.placeholders[_key]

  return res
}
/**
 * Combine two lists of matches by applying mergeMatch to the cartesian product of two lists of matches.
 * Each list represents matches found in one child of a node.
 */
function combineChildMatches(list1, list2) {
  const res = []
  if (list1.length === 0 || list2.length === 0)
    return res

  let merged
  for (let i1 = 0; i1 < list1.length; i1++) {
    for (let i2 = 0; i2 < list2.length; i2++) {
      merged = mergeMatch(list1[i1], list2[i2])
      if (merged)
        res.push(merged)
    }
  }
  return res
}
/**
 * Combine multiple lists of matches by applying mergeMatch to the cartesian product of two lists of matches.
 * Each list represents matches found in one child of a node.
 * Returns a list of unique matches.
 */
function mergeChildMatches(childMatches) {
  if (childMatches.length === 0)
    return childMatches

  const sets = childMatches.reduce(combineChildMatches)
  const uniqueSets = []
  const unique = {}
  for (let i = 0; i < sets.length; i++) {
    const s = JSON.stringify(sets[i])
    if (!unique[s]) {
      unique[s] = true
      uniqueSets.push(sets[i])
    }
  }
  return uniqueSets
}
/**
 * Determines whether node matches rule.
 *
 * @param {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} rule
 * @param {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} node
 * @return {object} Information about the match, if it exists.
 */
function _ruleMatch(rule, node, isSplit, scope, options) {
  // console.log('Entering _ruleMatch(' + JSON.stringify(rule) + ', ' + JSON.stringify(node) + ')')
  // console.log('rule = ' + rule)
  // console.log('node = ' + node)
  // console.log('Entering _ruleMatch(' + rule.toString() + ', ' + node.toString() + ')')
  let res = [{
    placeholders: {},
  }]
  // console.log("------------------")
  // console.log("MATCHING ", rule.toString(), ' | ', node.toString())
  // console.log("MATCHING (1)", rule)
  // console.log("MATCHING (2)", node)
  if ((rule instanceof SymbolNode) && (rule.name[0] === 'a')) {
    // Equation: Any node WITHOUT unknown variable.
    if (options.unknownVariable == null) {
      // Error - we want to match for unknown variable, but
      // we don't know what symbol is used for (e.g. x).
      throw 'error: unset unknown variable name'
    }
    else if (!Node.Type.doesContainSymbol(node, options.unknownVariable)) {
      // Matched - node does not contain unknown variable (x-like).
      res[0].placeholders[rule.name] = node
    }
    else {
      // Mis-match: node contains unknown variable.
      return []
    }
  }
  else if ((rule instanceof SymbolNode) && (rule.name.substr(0, 2) === 'fx')) {
    // Equation: Any node containing unknown variable f(x).
    if (options.unknownVariable == null) {
      // Error - we want to match for unknown variable, but
      // we don't know what symbol is used for (e.g. x).
      throw 'error: unset unknown variable name'
    }
    else if (Node.Type.doesContainSymbol(node, options.unknownVariable)) {
      // Matched - node containt any expression, which contains unkown
      // variable (x-like).
      res[0].placeholders[rule.name] = node
    }
    else {
      // Mis-match: node does not contain an unknown variable (x-like).
      return []
    }
  }
  else if (rule instanceof OperatorNode && node instanceof OperatorNode || rule instanceof FunctionNode && node instanceof FunctionNode) {
    // If the rule is an OperatorNode or a FunctionNode, then node must match exactly
    if (rule instanceof OperatorNode) {
      if (rule.op !== node.op || rule.fn !== node.fn)
        return []
    }
    else if (rule instanceof FunctionNode) {
      if (rule.name !== node.name)
        return []
    } // rule and node match. Search the children of rule and node.
    if (node.args.length === 1 && rule.args.length === 1 || !isAssociative(node) || isSplit) {
      // Expect non-associative operators to match exactly
      const childMatches = []
      for (let i = 0; i < rule.args.length; i++) {
        const childMatch = _ruleMatch(rule.args[i], node.args[i], false, scope, options)
        if (childMatch.length === 0) {
          // Child did not match, so stop searching immediately
          return []
        } // The child matched, so add the information returned from the child to our result
        childMatches.push(childMatch)
      }
      res = mergeChildMatches(childMatches)
    }
    else if (node.args.length >= 2 && rule.args.length === 2) {
      // node is flattened, rule is not
      // Associative operators/functions can be split in different ways so we check if the rule matches each
      // them and return their union.
      const splits = getSplits(node, rule.context)
      let splitMatches = []
      for (let _i = 0; _i < splits.length; _i++) {
        const matchSet = _ruleMatch(rule, splits[_i], true, scope, options) // recursing at the same tree depth here
        splitMatches = splitMatches.concat(matchSet)
      }
      return splitMatches
    }
    else if (rule.args.length > 2) {
      throw new Error(`Unexpected non-binary associative function: ${rule.toString()}`)
    }
    else {
      // Incorrect number of arguments in rule and node, so no match
      return []
    }
  }
  else if (rule instanceof SymbolNode) {
    // If the rule is a SymbolNode, then it carries a special meaning
    // according to the first character of the symbol node name.
    // c.* matches a ConstantNode
    // n.* matches any node
    if (rule.name.length === 0)
      throw new Error('Symbol in rule has 0 length...!?')

    if (SUPPORTED_CONSTANTS[rule.name]) {
      // built-in constant must match exactly
      if (rule.name !== node.name)
        return []
    }
    else if (rule.name === 'x') {
      // Equation: unknown variable.
      if (options.unknownVariable == null) {
        // Error - we want to match for unknown variable, but
        // we don't know what symbol is used for (e.g. x).
        throw 'error: unset unknown variable name'
      }
      // eslint-disable-next-line eqeqeq
      else if (node.name == options.unknownVariable) {
        // Matched - node is an unknown variable itself (x-like).
        res[0].placeholders[rule.name] = node
      }
      else {
        // Mis-match: it's not an unknown variable node (x-like).
        return []
      }
    }
    else if (rule.name[0] === 'n' || rule.name.substring(0, 2) === '_p') {
      // rule matches _anything_, so assign this node to the rule.name placeholder
      // Assign node to the rule.name placeholder.
      // Our parent will check for matches among placeholders.
      res[0].placeholders[rule.name] = node
    }
    else if (rule.name[0] === 'v') {
      // rule matches any variable thing (not a ConstantNode)
      if (!(0, isConstantNode)(node)) {
        res[0].placeholders[rule.name] = node
      }
      else {
        // Mis-match: rule was expecting something other than a ConstantNode
        return []
      }
    }
    else if (rule.name[0] === 'c') {
      // rule matches any ConstantNode
      if (node instanceof ConstantNode) {
        if (rule.isNegative) {
          if (math.isNegative(node.value)) {
            // -c : negative constant matched
            // Possible improvement: Optimize it.
            res[0].placeholders[rule.name] = Node.Creator.unaryMinus(node)
          }
          else {
            // We want negative constant, but non-negative found.
            return []
          }
        }
        else {
          res[0].placeholders[rule.name] = node
        }
      }
      else {
        // Mis-match: rule was expecting a ConstantNode
        return []
      }
    }
    else {
      throw new Error(`Invalid symbol in rule: ${rule.name}`)
    }
  }
  else if (rule instanceof AccessorNode) {
    // Try exactly const.x match.
    // Example: const.pi vs const.pi
    if ((!(node instanceof AccessorNode))
      || (rule.object.name !== 'const')
      || (node.object.name !== 'const')
      || (rule.index.dimensions.length !== 1)
      || (node.index.dimensions.length !== 1)
      || (rule.index.dimensions[0].value !== node.index.dimensions[0].value)) {
      return []
    }
  }
  else if (rule instanceof ConstantNode) {
    // Literal constant must match exactly
    if (!equal(rule.value, node.value))
      return []
  }
  else {
    // Some other node was encountered which we aren't prepared for, so no match
    return []
  } // It's a match!

  return res
}
/**
 * Determines whether p and q (and all their children nodes) are identical.
 *
 * @param {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} p
 * @param {ConstantNode | SymbolNode | ParenthesisNode | FunctionNode | OperatorNode} q
 * @return {object} Information about the match, if it exists.
 */
function _exactMatch(p, q) {
  if (p instanceof ConstantNode && q instanceof ConstantNode) {
    if (!equal(p.value, q.value))
      return false
  }
  else if (p instanceof SymbolNode && q instanceof SymbolNode) {
    if (p.name !== q.name)
      return false
  }
  else if (p instanceof OperatorNode && q instanceof OperatorNode || p instanceof FunctionNode && q instanceof FunctionNode) {
    if (p instanceof OperatorNode) {
      if (p.op !== q.op || p.fn !== q.fn)
        return false
    }
    else if (p instanceof FunctionNode) {
      if (p.name !== q.name)
        return false
    }
    if (p.args.length !== q.args.length)
      return false

    for (let i = 0; i < p.args.length; i++) {
      if (!_exactMatch(p.args[i], q.args[i]))
        return false
    }
  }
  else if (p instanceof AccessorNode && q instanceof AccessorNode) {
    // Possible improvement: Handle multidimentional arrays?
    if ((p.object.name !== q.object.name)
      || (p.index.dimensions.length !== 1)
      || (q.index.dimensions.length !== 1)
      || (p.index.dimensions[0].value !== q.index.dimensions[0].value)) {
      return false
    }
  }
  else {
    return false
  }
  return true
}

function buildRulesAndMistakeRules(_rules, scope, options) {
  if (!_rules || _rules.length === 0)
    return _rules

  const normalRules = _rules.filter(rule => !rule.mistakeL)
  const normalBuiltRules = _buildRules(normalRules, scope, options)

  if (!options.getMistakes)
    return normalBuiltRules

  // This does not include mistakes that are just attached to a rule, like commonRulesMistakes. It only includes rules that have a mistakeL
  let mistakeRulesWithMistakeL = _rules.filter(rule => rule.mistakeL)
  mistakeRulesWithMistakeL = mistakeRulesWithMistakeL.map?.((rule) => {
    return rule.mistakes.map((mistake) => {
      const res = _buildRules([mistake], scope, options)[0]
      if (!res) {
        return null
      }
      return { ...res, isMistake: true, mistakeL: rule.l }
    }).filter(builtRule => builtRule)
  })

  // combine rules
  if (mistakeRulesWithMistakeL.length > 0) {
    const firstMistake = mistakeRulesWithMistakeL[0][0]
    const newMistakeRule = { ...firstMistake, mistakes: mistakeRulesWithMistakeL[0], isMistake: true }
    normalBuiltRules.push(newMistakeRule)
    return normalBuiltRules
  }
  else {
    return normalBuiltRules
  }
}
export default simplify
