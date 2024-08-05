const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const {math} = require('../../../config')
const {createFunctionForEveryRule} = require('../../util/ruleHelper')
const {applyRules} = require('../_common')

const poolOfRules = [

  // --------------------------------------------------------------------------
  //                               Basic rules
  // --------------------------------------------------------------------------

  // Power.
  {l: 'n^0' , r: '1' , id: ChangeTypes.REDUCE_EXPONENT_BY_ZERO},

  {l: 'n^1' , r: 'n' , id: ChangeTypes.REMOVE_EXPONENT_BY_ONE},
  {l: '0^n' , r: '0' , id: ChangeTypes.REMOVE_EXPONENT_BASE_ZERO},
  {l: '1^n' , r: '1' , id: ChangeTypes.REMOVE_EXPONENT_BASE_ONE},

  // Multiply.
  {l: '0*n'  , r: '0'  , id: ChangeTypes.MULTIPLY_BY_ZERO},
  {l: 'n*0'  , r: '0'  , id: ChangeTypes.MULTIPLY_BY_ZERO},

  {l: '1*n'  , r: 'n'  , id: ChangeTypes.REMOVE_MULTIPLYING_BY_ONE},
  {l: 'n*1'  , r: 'n'  , id: ChangeTypes.REMOVE_MULTIPLYING_BY_ONE},
  {l: '-1*n' , r: '-n' , id: ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE},

  // Division.
  {l: '0/n'  , r: '0'  , id: ChangeTypes.REDUCE_ZERO_NUMERATOR},
  {l: 'n/1'  , r: 'n'  , id: ChangeTypes.DIVISION_BY_ONE},
  {l: 'n/-1' , r: '-n' , id: ChangeTypes.DIVISION_BY_NEGATIVE_ONE},

  // Addition.
  {l: 'n+0' , r: 'n' , id: ChangeTypes.REMOVE_ADDING_ZERO},
  {l: 'n-0' , r: 'n' , id: ChangeTypes.REMOVE_ADDING_ZERO},

  // Distribute minus one.
  {l: '-(n1/n2)' , r: '(-n1)/n2' , id: ChangeTypes.DISTRIBUTE_NEGATIVE_ONE},

  // Double minus.
  {l: '-(-c)'      , r: 'c'       , id: ChangeTypes.RESOLVE_DOUBLE_MINUS},
  {l: '-(-c v)'    , r: 'c v'     , id: ChangeTypes.RESOLVE_DOUBLE_MINUS},
  {l: '-(-n)'      , r: 'n'       , id: ChangeTypes.RESOLVE_DOUBLE_MINUS},
  {l: 'n1 - (-n2)' , r: 'n1 + n2' , id: ChangeTypes.RESOLVE_DOUBLE_MINUS},
  {l: 'n1 - (-c1)' , r: 'n1 + c1' , id: ChangeTypes.RESOLVE_DOUBLE_MINUS},

  // --------------------------------------------------------------------------
  //                           Constant arithmetic
  // --------------------------------------------------------------------------

  {
    l: 'c1 + c2',
    id: ChangeTypes.SIMPLIFY_ARITHMETIC__ADD,
    replaceFct: function (node, vars) {
      return Node.Creator.constant(math.add(vars.c1.value, vars.c2.value))
    }
  },
  {
    l: 'c1 - c2',
    id: ChangeTypes.SIMPLIFY_ARITHMETIC__SUBTRACT,
    replaceFct: function (node, vars) {
      return Node.Creator.constant(math.subtract(vars.c1.value, vars.c2.value))
    }
  },
  {
    l: 'c1 * c2' ,
    id: ChangeTypes.SIMPLIFY_ARITHMETIC__MULTIPLY,
    replaceFct: function (node, vars) {
      return Node.Creator.constant(math.multiply(vars.c1.value, vars.c2.value))
    }
  },
  {
    l: 'c1 ^ c2',
    id: ChangeTypes.SIMPLIFY_ARITHMETIC__POWER,
    replaceFct: function (node, vars) {
      return Node.Creator.constant(math.pow(vars.c1.value, vars.c2.value))
    }
  },

  // --------------------------------------------------------------------------
  //                                  Percents
  // --------------------------------------------------------------------------

  {
    l: 'percent(c1) + percent(c2)',
    id: ChangeTypes.PERCENTS_ADD,
    replaceFct: function (node, vars) {
      return Node.Creator.percent(Node.Creator.constant(math.add(vars.c1.value, vars.c2.value)))
    }
  },
  {
    l: 'percent(c1) - percent(c2)',
    id: ChangeTypes.PERCENTS_SUB,
    replaceFct: function (node, vars) {
      return Node.Creator.percent(Node.Creator.constant(math.subtract(vars.c1.value, vars.c2.value)))
    }
  },
  {
    l: 'percent(n)',
    r: 'n/100',
    id: ChangeTypes.PERCENTS_CONVERT_TO_FRACTION,
  },

  // --------------------------------------------------------------------------
  //                               Fractions
  // --------------------------------------------------------------------------

  // Multiply.
  {l: 'n1/v2 * n3'    , r: '(n1 * n3) / v2'    , id: ChangeTypes.MULTIPLY_FRACTIONS},
  {l: 'v1/n2 * n3'    , r: '(v1 * n3) / n2'    , id: ChangeTypes.MULTIPLY_FRACTIONS},
  {l: 'n1/n2 * n3/n4' , r: '(n1 n3) / (n2 n4)' , id: ChangeTypes.MULTIPLY_FRACTIONS},
  {l: 'c1/c2 * c3'    , r: '(c1 c3) / c2'      , id: ChangeTypes.MULTIPLY_FRACTIONS},

  // Remove nested fraction.
  // x/y/z   gives x/(y*z)
  // (x/y)/z gives x/(y*z)
  {l: 'n1/n2/n3'      , r: 'n1/(n3*n2)'      , id: ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION},
  {l: '(n1/n2)/n3'    , r: 'n1/(n2*n3)'      , id: ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION},
  {l: 'n1/(n2/n3)'    , r: 'n1*(n3/n2)'      , id: ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION},
  {l: 'n1/(n2/n3*n4)' , r: '(n1 n3)/(n2 n4)' , id: ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION},

  // Avoid minus in denominator
  {l: '-n1 / (-n2)'       , r: 'n1/n2'        , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: '-c1 / (-c2)'       , r: 'c1/c2'        , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: 'n1 / (-n2)'        , r: '-n1/n2'       , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: 'n1 / (-c2)'        , r: '-n1/c2'       , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: 'n1 / ((-n2) * n3)' , r: '-n1/(n2 n3)'  , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: 'n1 + n2 * (-n3)'   , r: 'n1 - (n2 n3)' , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: '-n1 * (-n2)'       , r: 'n1 n2'        , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: '-c1 * (-n2)'       , r: 'c1 n2'        , id: ChangeTypes.SIMPLIFY_SIGNS},
  {l: '-(c1/c2*n)'        , r: '-c1/c2*n'     , id: ChangeTypes.SIMPLIFY_SIGNS},

  // Add fraction with common denominator.
  {l: 'c1    + c3/c2' , r: '(c1*c2+c3) / c2' , id: ChangeTypes.ADD_FRACTIONS},
  {l: 'c1/c2 + c3/c2' , r: '(c1+c3)    / c2' , id: ChangeTypes.ADD_FRACTIONS},

  // Find common denominator before fractions add.
  {
    l: 'c1/c2 + c3/c4' ,
    id: ChangeTypes.COMMON_DENOMINATOR,
    replaceFct: function (node, vars) {
      // Fetch numerators and denominators values.
      let numerator1 = vars.c1
      let numerator2 = vars.c3

      let denominator1 = vars.c2
      let denominator2 = vars.c4

      // Find lowest common multiplier (LCM).
      const lcm = Node.Creator.constant(
        math.lcm(denominator1.value, denominator2.value))

      // Apply LCM to first fraction if needed.
      if (!math.equal(denominator1.value, lcm.value)) {
        numerator1 = Node.Creator.operator('*', [
          numerator1,
          Node.Creator.constant(math.divide(lcm.value, denominator1.value))
        ])
      }

      // Apply LCM to first fraction if needed.
      if (!math.equal(denominator2.value, lcm.value)) {
        numerator2 = Node.Creator.operator('*', [
          numerator2,
          Node.Creator.constant(math.divide(lcm.value, denominator2.value))
        ])
      }

      // Build final expression.
      const rv = Node.Creator.operator('/', [
        Node.Creator.operator('+', [numerator1, numerator2]),
        lcm
      ])

      return rv
    }
  },
]


module.exports = {
  commonRules:  createFunctionForEveryRule(poolOfRules),
  commonRulesPooledTogether:  (node) => applyRules(node, poolOfRules)
}
