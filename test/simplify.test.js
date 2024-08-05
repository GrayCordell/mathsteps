const assert    = require('assert')
const mathsteps = require('../index.js')
const print     = require('../lib/util/print')
const {expressionEquals} = require('../lib/util/expressionEqualsAndNormalization')

function testSimplify(exprStr, outputStr, debug = false, ctx) {
  it(exprStr + ' -> ' + outputStr, function () {
    this.timeout(10000)
    const options = {
      expressionAsText: exprStr,
      isDebugMode: debug,
      expressionCtx: ctx
    }

    const resultNode   = mathsteps.simplifyExpression(options)
    const resultAsText = print.ascii(resultNode)

    const isEqual = expressionEquals(resultAsText, outputStr)
    const isDeepEqual = resultAsText === outputStr
    let outputMessage = `Expected: ${outputStr}, got: ${resultAsText}`
    outputMessage += isEqual && !isDeepEqual
        ? ' (but only deep equal)'
        : ' (both deep and equal)'

    assert.deepEqual(resultAsText, outputStr,outputMessage)
  })
}

describe('simplify (basics)', function () {
  // Imported from https://github.com/google/mathsteps/tree/division.
  // Thanks to Anthony Liang (https://github.com/aliang8)
  const tests = [
    // Arithmetics with zero
    ['x + 0', 'x'],
    ['2 * 0 * x', '0'],
    ['(x+3)^0', '1'],
    ['0 x', '0'],
    ['2*0*z^2','0'],
    ['0/5', '0'],
    ['0/(x+6+7+x^2+2^y)', '0'],
    ['2+0+x', 'x + 2'],
    ['2+x+0', 'x + 2'],
    ['0+2+x', 'x + 2'],

    // Arithmetic with one.
    ['x/1', 'x'],
    ['1^3', '1'],
    ['1^x', '1'],
    ['x^1', 'x'],
    ['1^(2 + 3 + 5/4 + 7 - 6/7)', '1'],
    ['x*1', 'x'],
    ['1x', 'x'],
    ['1*z^2', 'z^2'],
    ['2*1*z^2', '2z^2'],


    // Arithmetic with minus one.
    ['-1*x', '-x'],
    ['x^2*-1', '-x^2'],
    ['2x*2*-1', '-4x'],

    // Rearrange coefficients
    ['2 * x^2', '2x^2'],
    ['y^3 * 5', '5y^3'],

    // Remove unary minus.
    ['--5', '5'],
    ['--x', 'x'],

    // Simplify signs.
    ['-12x / -27', '4/9x'],
    ['x / -y', '-x / y'],

    // Division.
    ['6/x/5', '6 / (5x)'],
    ['-(6/x/5)', '-6 / (5x)'],
    ['-6/x/5', '-6 / (5x)'],
    ['(2+2)/x/6/(y-z)', '2 / (3x * y - 3x * z)'],
    ['2/x', '2 / x'],
    ['x/(2/3)', '3/2x'],
    ['x / (y/(z+a))', 'x * z / y + a * x / y'],
    ['x/((2+z)/(3/y))', '3x / (y * z + 2y)'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('simplify (arithmetic)', function () {
  const tests = [
    ['(2+2)*5', '20'],
    ['(8+(-4))*5', '20'],
    ['5*(2+2)*10', '200'],
    ['(2+(2)+7)', '11'],
    ['(8-2) * 2^2 * (1+1) / (4 /2) / 5', '24/5'],
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['6*6', '36'],
    ['9/4', '9/4'], //  does not divide
    ['16 + - 1953125', '-1953109'], // verify large negative number round correctly
    ['16 - 1953125', '-1953109'], // verify large negative number round correctly

    ['(2+2)', '4'],
    ['(2+2)*5', '20'],
    ['5*(2+2)', '20'],
    ['2*(2+2) + 2^3', '16'],
    ['6*6', '36'],
    ['2+x', 'x + 2'],
    ['(2+2)*x', '4x'],
    ['(2+2)*x+3', '4x + 3'],
    ['2+x+7', 'x + 9'],
    ['2x^2 * y * x * y^3', '2x^3 * y^4'],
    ['12x^2', '12x^2'],

    // Absolute value.
    ['abs(4)', '4'],
    ['abs(-5)', '5'],

    // 2 cases from mrAlbert-development/mathsteps
    // https://github.com/mrAlbert-development/mathsteps/commit/0a93063ffc89447b2ec76608b3d9f1307bedfaf5
    ['12x - 11x', 'x'],
    ['11x - 12x', '-x'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('simplify (percents)', function () {
  const tests = [
    // Percent to fraction conversion.
    ['percent(1)', '1/100'],
    ['percent(2)', '1/50'],
    ['percent(100)', '1'],
    ['percent(123)', '123/100'],
    ['percent(200)', '2'],

    // Percent-percent arithmetic.
    ['percent(1) + percent(2)', '3/100'],
    ['percent(7) - percent(3)', '1/25'],
    ['percent(2) * percent(3)', '3/5000'],
    ['percent(20) / percent(4)', '5'],

    // Percent-number arithmetic.
    ['percent(1) + 2', '201/100'],
    ['percent(7) - 3', '-293/100'],
    ['percent(2) * 3', '3/50'],
    ['percent(20) / 4', '1/20'],

    // Percent-symbol arithmetic.
    ['percent(1) + x', 'x + 1/100'],
    ['percent(7) - x', '7/100 - x'],
    ['percent(234) * x', '117/50x'],
    ['percent(20) / x', '1 / (5x)'],

    // Non constant percent.
    ['percent(x) + x', '101/100x'],
    ['x - percent(x)', 'x - x / 100'], // TODO: 99/100x
    ['percent(x) * x', 'x^2 / 100'],
    ['percent(x) / x', '1/100'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('collects and combines like terms', function() {
  const tests = [
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
    ['2x^2 * y * x * y^3', '2x^3 * y^4'],
    ['4y*3*5', '60y'],
    ['(2x^2 - 4) + (4x^2 + 3)', '6x^2 - 1'],
    ['(2x^1 + 4) + (4x^2 + 3)', '4x^2 + 2x + 7'],
    ['y * 2x * 10', '20x * y'],
    ['x^y * x^z', 'x^(y + z)'],
    ['x^(3+y) + x^(3+y)+ 4', '2x^(y + 3) + 4'],
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
    ['5/2x - 3/2x', 'x'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})


describe('can simplify with division', function () {
  const tests = [
    ['2 * 4 / 5 * 10 + 3', '19'],
    ['2x * 5x / 2', '5x^2'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x * 4x / 2 / 4', 'x^2'],
    ['2x * y / z * 10', '20x * y / z'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x/x', '2'],
    ['2x/4/3', '1/6x'],
    ['((2+x)(3+x))/(2+x)', 'x + 3'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
  // TODO: factor the numerator to cancel out with denominator
  // e.g. (x^2 - 3 + 2)/(x-2) -> (x-1)
})

describe('subtraction support', function() {
  const tests = [
    ['-(-(2+3))', '5'],
    ['-(-5)', '5'],
    ['-(-(2+x))', 'x + 2'],
    ['-------5', '-5'],
    ['--(-----5) + 6', '1'],
    ['x^2 + 3 - x*x', '3'],
    ['-(2*x) * -(2 + 2)', '8x'],
    ['(x-4)-5', 'x - 9'],
    ['5-x-4', '1 - x'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('break up numerator', function() {
  const tests = [
    ['(x+3+y)/3', 'x / 3 + y / 3 + 1'],
    ['(2+x)/4', 'x / 4 + 1/2'],
    ['2(x+3)/3', '2/3x + 2'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('support for more * and ( that come from latex conversion', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(12*z^(2))/27', '4/9z^2'],
    ['x^2 - 12x^2 + 5x^2 - 7', '-6x^2 - 7'],
    ['-(12 x ^ 2)', '-12x^2']
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('distribution', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(3+x)*(4+x)*(x+5)', 'x^3 + 12x^2 + 47x + 60'],
    ['-2x^2 * (3x - 4)', '-6x^3 + 8x^2'],
    ['x^2 - x^2*(12 + 5x) - 7', '-5x^3 - 11x^2 - 7'],
    ['(5+x)*(x+3)', 'x^2 + 8x + 15'],
    ['(x-2)(x-4)', 'x^2 - 6x + 8'],
    ['- x*y^4 (6x * y^2 + 5x*y - 3x)', '-6x^2 * y^6 - 5x^2 * y^5 + 3x^2 * y^4'],

    // Expanding exponents
    ['(nthRoot(x, 2))^2', 'x'],
    ['(nthRoot(x, 2))^4', 'x^2'],
    ['3 * (nthRoot(x, 2))^2', '3x'],
    ['(nthRoot(x, 2))^6 * (nthRoot(x, 3))^3', 'x^4'],
    ['(x - 2)^2', 'x^2 - 4x + 4'],
    ['(3x + 5)^2', '9x^2 + 30x + 25'],
    ['(2x + 3)^2','4x^2 + 12x + 9'],
    ['(x + 3 + 4)^2', 'x^2 + 14x + 49'],

    // -------------------------------------------------------------------------
    // Cases from al_distribute_over_mult
    // Thanks to Anthony Liang (https://github.com/aliang8)
    // Originaly live in distribute tests.
    // Expanding negative exponents
    ['(x y)^-1', '1 / (x * y)'],
    ['(x y z)^-a', '1 / (x^a * y^a * z^a)'],

    // Distributing exponents to base
    ['(x y)^2', 'x^2 * y^2'],
    ['(x y)^(2x)' ,'x^(2x) * y^(2x)'],

    ['((x + 1) y)^2', 'x^2 * y^2 + 2x * y^2 + y^2'],
    ['(2x * y * z)^2', '4x^2 * y^2 * z^2'],
    ['(2x^2 * 3y^2)^2', '36x^4 * y^4'],
    ['((x + 1)^2 (x + 1)^2)^2', 'x^8 + 8x^7 + 28x^6 + 56x^5 + 70x^4 + 56x^3 + 28x^2 + 8x + 1'],
    ['(x * y * (2x + 1))^2', '4x^4 * y^2 + 4x^3 * y^2 + x^2 * y^2'],
    ['((x + 1) * 2y^2 * 2)^2', '16x^2 * y^4 + 32x * y^4 + 16y^4'],
    ['(2x * (x + 1))^2', '4x^4 + 8x^3 + 4x^2'],
    ['(x^2 y)^2.5', 'x^5 * y^(5/2)'],

    // Fractional exponents
    ['(x^2 y^2)^(1/2)', 'x * y'],
    ['(x^3 y^3)^(1/3)', 'x * y'],
    ['(2x^2 * y^2)^(1/2)', 'x * y * sqrt(2)'],

    // nthRoot to a power
    ['(nthRoot(x, 2) * nthRoot(x, 2))^2', 'x^2'],
    ['(nthRoot(x, 2))^3', 'x^(3/2)'],
    ['3 * nthRoot(x, 2) * (nthRoot(x, 2))^2', '3x^(3/2)'],
    ['(nthRoot(x, 2) * nthRoot(x, 3))^2', 'x^(5/3)'],
    ['nthRoot(x, 2)^(1/2)', 'x^(1/4)'],
    ['(nthRoot(x^2, 2)^2 * nthRoot(x, 3)^3)^2', 'x^6'],

    // -------------------------------------------------------------------------
    // distribute - into paren with addition
    ['-(x+3)', '-x - 3'],
    ['-(x - 3)', '-x + 3'],
    ['-(-x^2 + 3y^6)' , '-3y^6 + x^2'],

    // distribute - into paren with multiplication/division
    ['-(x*3)', '-3x'],
    ['-(-x * 3)', '3x'],
    ['-(-x^2 * 3y^6)', '3x^2 * y^6'],

    // other
    ['x*(x+2+y)', 'x^2 + x * y + 2x'],
    ['(x+2+y)*x*7', '7x^2 + 7x * y + 14x'],
    ['(5+x)*(x+3)', 'x^2 + 8x + 15'],
    ['-2x^2 * (3x - 4)', '-6x^3 + 8x^2'],

    // distribute the non-fraction term into the numerator(s)
    [
      '(3 / x^2 + x / (x^2 + 3)) * (x^2 + 3)',
      '9 / x^2 + x + 3'
    ],

    // if both groupings have fraction, the rule does not apply
    [
      '(3 / x^2 + x / (x^2 + 3)) * (5 / x + x^5)',
      'x^6 / (x^2 + 3) + 15 / x^3 + 3x^3 + 5 / (x^2 + 3)'
    ],

    // multisteps
    [
      '(2 / x +  3x^2) * (x^3 + 1)',
      '3x^5 + 5x^2 + 2 / x'
    ],

    [
      '(2x + x^2) * (1 / (x^2 -4) + 4x^2)',
      'x^2 / (x^2 - 4) + 4x^4 + 2x / (x^2 - 4) + 8x^3'
    ],

    [
      '(2x + x^2) * (3x^2 / (x^2 -4) + 4x^2)',
      '3x^4 / (x^2 - 4) + 6x^3 / (x^2 - 4) + 4x^4 + 8x^3'
    ],

    // expand base
    ['(nthRoot(x, 2))^2' , 'x'],
    ['(nthRoot(x, 2))^3' , 'x^(3/2)'],
    ['3 * (nthRoot(x, 2))^4', '3x^2'],
    ['(nthRoot(x, 2) + nthRoot(x, 3))^2', 'x + 2x^(5/6) + x^(2/3)'],
    ['(2x + 3)^2', '4x^2 + 12x + 9'],
    ['(x + 3 + 4)^2', 'x^2 + 14x + 49'],

    // These should not expand
    // Needs to have a positive integer exponent > 1
    ['x + 2', 'x + 2'],
    ['(x + 2)^-1', '1 / (x + 2)'],
    ['(x + 1)^x', '(x + 1)^x'],
    ['(x + 1)^(2x)', '(x + 1)^(2x)'],
    ['(x + 1)^(1/2)', '(x + 1)^(1/2)'],
    ['(x + 1)^2.5', '(x + 1)^(5/2)'],

    // One case from al_distribute_over_mult
    ['1 / (x + 1)^x', '1 / (x + 1)^x'],

    // Test case from jefferysac/mathsteps:
    // https://github.com/jefferysac/mathsteps/commit/776439122dbeef1169d4c5661856fdd46ab25999
    // distribute the non-fraction term into the numerator(s)
    ['(3 / x^2 + x / (x^2 + 3)) * (x^2 + 3)', '9 / x^2 + x + 3'],

    // Test case from jefferysac/mathsteps:
    // https://github.com/jefferysac/mathsteps/commit/776439122dbeef1169d4c5661856fdd46ab25999
    // if both groupings have fraction, the rule does not apply
    [
      '(3 / x^2 + x / (x^2 + 3)) * (5 / x + x^5)',
      'x^6 / (x^2 + 3) + 15 / x^3 + 3x^3 + 5 / (x^2 + 3)'
    ],

    // Test cases from lexiross/mathsteps:
    // https://github.com/lexiross/mathsteps/commit/059b5991e4e83eef08ef2b4b906c4e79ba467730
    ['(1 / x +  x^2) * (x^3 + 1)', 'x^5 + 2x^2 + 1 / x'],
    ['(3 / x^2 + x / (x^2 + 3)) * (x^2 + 3)', '-9 / x^2 + x + 3   '],
    ['(3 / x^2 + x / (x^2 + 3)) * (5 / x + x^5)', 'x^6 / (x^2 + 3) + 15 / x^3 + 3x^3 + 5 / (x^2 + 3)'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('fractions', function() {
  const tests = [
    ['5x + (1/2)x', '11/2x'],
    ['x + x/2', '3/2x'],
    ['1 + 1/2', '3/2'],
    ['2 + 5/2 + 3', '15/2'],
    ['9/18-5/18', '2/9'],
    ['2(x+3)/3', '2/3x + 2'],
    ['(2 / x) * x', '2'],
    ['5/18 - 9/18', '-2/9'],
    ['9/18', '1/2'],
    ['x/(2/3) + 5', '3/2x + 5'],
    ['(2+x)/6', 'x / 6 + 1/3'],

    // Cancel by GCD
    ['2/4', '1/2'],
    ['9/3', '3'],
    ['12/27', '4/9'],
    ['1/-3', '-1/3'],
    ['-3/-2', '3/2'],
    ['-1/-1', '1'],
    ['15/6', '5/2'],
    ['24/40', '3/5'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('floating point', function() {
  testSimplify('1.983*10', '1983/100')
})

describe('cancelling out', function() {
  const tests = [
    ['(x^3*y)/x^2 + 5', 'x * y + 5'], // TODO: x y + 5
    ['(x^(2)+y^(2))/(5x-6x) + 5', '-y^2 / x - x + 5'],
    ['( p ^ ( 2) + 1)/( p ^ ( 2) + 1)', '1'],
    ['(-x)/(x)', '-1'],
    ['(x)/(-x)', '-1'],
    ['((2x^3 y^2)/(-x^2 y^5))^(-2)', 'y^6 / (4x^2)'],
    ['(1+2a)/a', '1 / a + 2'],
    ['(x ^ 4 * y + -(x ^ 2 * y ^ 2)) / (-x ^ 2 * y)', 'y - x^2'],
    ['6 / (2x^2)', '3 / x^2'],

    // Cancel like terms.
    ['2/2', '1'],
    ['x^2/x^2', '1'],
    ['x^3/x^2', 'x'],
    ['(x^3*y)/x^2', 'x * y'],
    ['-(7+x)^8/(7+x)^2', '-42x^5 - 735x^4 - 6860x^3 - 36015x^2 - 100842x - 117649 - x^6'],
    ['(2x^2 * 5) / (2x^2)', '5'], // these parens have to stay around 2x^2 to be parsed correctly.
    ['(x^2 * y) / x', 'x * y'],
    ['2x^2 / (2x^2 * 5)', '1/5'],
    ['x / (x^2*y)', '1 / (x * y)'],
    ['(4x^2) / (5x^2)', '4/5'],
    ['(2x+5)^8 / (2x+5)^2', '64x^6 + 960x^5 + 6000x^4 + 20000x^3 + 37500x^2 + 37500x + 15625'],
    ['(4x^3) / (5x^2)', '4/5x'],
    ['-x / -x', '1'],
    ['2/ (4x)', '1 / (2x)'],

    ['2/ (4x^2)', '1 / (2x^2)'],
    ['2 a / a', '2'],
    ['(35 * nthRoot (7)) / (5 * nthRoot(5))', '7 * sqrt(7) / sqrt(5)'],
    ['3/(9r^2)', '1 / (3r^2)'],
    ['6/(2x)', '3 / x'],

    // Cases from evykassirer/mathsteps:
    // https://github.com/evykassirer/mathsteps/commit/e5a69b7c0e366ae0c51dd5296038a568bcbdf8db
    ['6/(2x)', '3 / x'],
    ['(40 * x) / (20 * y)', '2x / y'],
    ['(20 * x) / (40 * y)', 'x / (2y)'],
    ['20x / (40y)', 'x / (2y)'],
    ['60x / (40y)', '3x / (2y)'],
    ['4x / (2y)', '2x / y'],
    ['(20 * x) / (5 * (40 * y))', 'x / (10y)'],
    ['400 * z / ((20 * x) / (5 * (40 * y)))', '4000y * z / x'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('absolute value support', function() {
  const tests = [
    ['(x^3*y)/x^2 + abs(-5)', 'x * y + 5'],
    ['-6 + -5 - abs(-4) + -10 - 3 abs(-4)', '-37'],
    ['5*abs((2+2))*10', '200'],
    ['5x + (1/abs(-2))x', '11/2x'],
    ['abs(5/18-abs(9/-18))', '2/9'],
    // handle parens around abs()
    ['( abs( -3) )/(3)', '1'],
    ['- abs( -40)', '-40'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('nthRoot support', function() {
  const tests = [
    ['nthRoot(4x, 2)', '2 * sqrt(x)'],
    ['2 * nthRoot(4x, 2)', '4 * sqrt(x)'],
    ['(x^3*y)/x^2 + nthRoot(4x, 2)', 'x * y + 2 * sqrt(x)'],
    ['2 + nthRoot(4)', '4'],
    ['x * nthRoot(x^4, 2)', 'x^3'],
    ['x * nthRoot(2 + 2, 3)', 'x * nthRoot(4, 3)'],
    ['x * nthRoot((2 + 2) * 2, 3)', '2x'],
    ['nthRoot(x * (2 + 3) * x, 2)', 'x * sqrt(5)'],
    ['sqrt(x) * nthRoot(x,3)', 'x^(5/6)'],
    ['nthRoot(x,3) * sqrt(x)', 'x^(5/6)'],
    ['nthRoot(x,3) * nthRoot(x,4)', 'x^(7/12)'],
    ['nthRoot(x,3) * nthRoot(x,4) * nthRoot(x,5)', 'x^(47/60)'],

    // 2 cases from isadounikau/mathsteps
    // https://github.com/isadounikau/mathsteps/commit/7809ff8e34bdab4bd95bf5e20c20c828673de964
    ['nthRoot(64, 3)', '4'],
    ['nthRoot(35937, 3)', '33'],

    // 1 case from mrAlbert-development/mathsteps
    // https://github.com/mrAlbert-development/mathsteps/commit/0a93063ffc89447b2ec76608b3d9f1307bedfaf5
    ['3*nthRoot(11,2) - 2*nthRoot(11,2)', 'sqrt(11)']
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('add constant fractions', function () {
  const tests = [
    ['4/5 + 3/5', '7/5'],
    ['4/10 + 3/5', '1'],
    ['4/9 + 3/5', '47/45'],
    ['4/5 - 4/5', '0'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('add constant and fraction', function () {
  const tests = [
    ['7 + 1/2', '15/2'],
    ['5/6 + 3', '23/6'],
    ['1/2 + 5.8', '63/10'],
    ['1/3 + 5.8', '92/15'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})


describe('multiply fractions', function() {
  const tests = [
    ['3 * 1/5 * 5/9', '1/3'],
    ['3/7 * 10/11', '30/77'],
    ['2 * 5/x', '10 / x'],
    ['2 * (5/x)', '10 / x'],
    ['(5/x) * (2/x)', '10 / x^2'],
    ['(5/x) * x', '5'],
    ['2x * 9/x', '18'],
    ['-3/8 * 2/4', '-3/16'],
    ['(-1/2) * 4/5', '-2/5'],
    ['4 * (-1/x)', '-4 / x'],
    ['x * 2y / x', '2y'],
    ['x/z * 1/2', 'x / (2z)'],
    ['(6y / x) * 4x', '24y'],
    ['2x * y / z * 10', '20x * y / z'],
    ['-(1/2) * (1/2)', '-1/4'],
    ['x * -(1/x)', '-1'],
    ['-(5/y) * -(x/y)', '5x / y^2'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('handles unnecessary parens at root level', function() {
  const tests = [
    ['(x+(y))', 'x + y'],
    ['((x+y) + ((z^3)))', 'z^3 + x + y'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('keeping parens in important places, on printing', function() {
  const tests = [
    ['2 / (3x^2) + 5', '2 / (3x^2) + 5'],
    // Test case from shirleymiao/mathsteps
    // https://github.com/shirleymiao/mathsteps/commit/27adb5eca3617a9b1cd083798086ffe738bf6c90
    ['((4+x)-5)^(2)', 'x^2 - 2x + 1'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('nthRoot', function() {
  const tests = [
    ['nthRoot(4)', '2'],
    ['nthRoot(8, 3)', '2'],
    ['nthRoot(5 * 7)', 'sqrt(35)'],
    ['nthRoot(4, 3)', 'nthRoot(4, 3)'],
    ['nthRoot(12)', '2 * sqrt(3)'],
    ['nthRoot(36)', '6'],
    ['nthRoot(72)', '6 * sqrt(2)'],
    ['nthRoot(x^2)', 'x'],
    ['nthRoot(x ^ 3)', 'x^(3/2)'],
    ['nthRoot(x^3, 3)', 'x'],
    ['nthRoot(-2)', 'sqrt(-2)'],
    ['nthRoot(2 ^ x, x)', '2'],
    ['nthRoot(x ^ (1/2), 1/2)', 'x'],
    ['nthRoot(2 * 2, 2)', '2'],
    ['nthRoot(3 * 2 * 3 * 2, 2)', '6'],
    ['nthRoot(36*x)', '6 * sqrt(x)'],
    ['nthRoot(2 * 18 * x ^ 2, 2)', '6x'],
    ['nthRoot(x * x, 2)', 'x'],
    ['nthRoot(x * x * (2 + 3), 2)', 'x * sqrt(5)'],
    ['nthRoot(64, 3)', '4'],
    ['nthRoot(35937, 3)', '33'],

    ['nthRoot(12)', '2 * sqrt(3)'],
    ['nthRoot(72)', '6 * sqrt(2)'],
    ['nthRoot(36*x)', '6 * sqrt(x)'],
    ['nthRoot(2 * 18 * x^2, 2)', '6x'],
    ['nthRoot(32, 3)', '2 * nthRoot(4, 3)'],
    ['nthRoot(32, 4)', '2 * nthRoot(2, 4)'],
    ['nthRoot(2 * 2 * 3 * 2, 3)', '2 * nthRoot(3, 3)'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('kemu extensions', function() {
  const tests = [
    // Basic.
    ['((2 const.pi)^2)/(4*const.pi)', 'const.pi'],
    ['sqrt((2 const.pi) ^ 2 / (4 const.pi ^ 2))' , '1'],
    ['(a*b*c*d)^2', 'a^2 * b^2 * c^2 * d^2'],
    ['(4 const.pi^2)/(4*const.pi)', 'const.pi'],
    ['sqrt(a)*sqrt(a)', 'a'],
    ['(2 * sqrt(const.pi))*(sqrt(((2 const.pi)^2)/(4*const.pi)))', '2const.pi'],
    ['a*b*c*d', 'a * b * c * d'],
    ['const.pi*((1/const.pi)^2)', '1 / const.pi'],
    ['const.pi*1/const.pi^2', '1 / const.pi'],
    ['x*a/x^2', 'a / x'],
    ['(const.pi^2)^3', 'const.pi^6'],
    ['x*(1/x)', '1'],
    ['x*(a/x)', 'a'],
    ['(a*x)*(b/x)', 'a * b'],
    ['const.pi*((sqrt(2))^2)', '2const.pi'],
    ['sqrt(x)^3', 'x^(3/2)'],
    ['(2*const.pi)*sqrt(2)', '2const.pi * sqrt(2)'],
    ['2 * const.pi * 1 / const.pi', '2'],
    ['2 const.pi * 1 / x', '2const.pi / x'],
    ['4 / (4const.pi)', '1 / const.pi'],
    ['(x/a) * (b/x)', 'b / a'],
    ['x*sqrt(const.pi) * sqrt(a)*3', '3x * sqrt(a * const.pi)'],
    ['const.pi ^ -1', '1 / const.pi'],
    ['x/(d*x*e)', '1 / (d * e)'],
    ['const.pi * (1 / const.pi) ^ 2', '1 / const.pi'],
    ['sqrt(1/const.pi)', '1 / sqrt(const.pi)'],
    ['sqrt(x^2)', 'x'],
    ['sqrt(x^6)', 'x^3'],
    ['sqrt(const.pi^2)', 'const.pi'],
    ['sqrt(const.pi^6)', 'const.pi^3'],
    ['2*5x^2 + sqrt(5)', '10x^2 + sqrt(5)'],
    ['5^2-4*sqrt(2)*(-8)', '25 + 32 * sqrt(2)'], // TODO: 25 + 32 sqrt(2)
    ['2-3*sqrt(5)*(-4)', '2 + 12 * sqrt(5)'],    // TODO: 2 + 12 sqrt(5)
    ['1 - 1/2', '1/2'],
    ['-20/9*q - 109/25', '-20/9*q - 109/25'],

    // Sqrt from const (simple radicand).
    ['sqrt(0)', '0'],
    ['sqrt(1)', '1'],
    ['sqrt(2)', 'sqrt(2)'],
    ['sqrt(4)', '2'],
    ['sqrt(8)', '2 * sqrt(2)'],
    ['sqrt(245)', '7 * sqrt(5)'],
    ['sqrt(352512)', '144 * sqrt(17)'],
    ['sqrt(434957043)', '12041 * sqrt(3)'],

    // Sqrt from const (complex radicand).
    ['sqrt(2x)', 'sqrt(2x)'],
    ['sqrt(4x)', '2 * sqrt(x)'],
    ['sqrt(12x)', '2 * sqrt(3x)'],
    ['sqrt(434957043*x)', '12041 * sqrt(3x)'],
    ['sqrt(x * 4 * y)', '2 * sqrt(x * y)'],
    ['sqrt(x * 434957043 * y)', '12041 * sqrt(3x * y)'],

    // Multiply order: Nothing changed
    ['x', 'x'],
    ['x y', 'x * y'],
    ['3 x y', '3x * y'],

    // Multiply order: Changed
    ['y x', 'x * y'],
    ['y z x a', 'a * x * y * z'],
    ['y z * 4 * x a', '4a * x * y * z'],

    // Collects and combines like terms
    ['(x + x) + (x^2 + x^2)', '2x^2 + 2x'],
    ['10 + (y^2 + y^2)', '2y^2 + 10'],
    ['10y^2 + 1/2*y^2 + 3/2*y^2', '12y^2'],
    ['x + y + y^2', 'y^2 + x + y'],
    ['2x^(2+1)', '2x^3'],

    // Collect like terms with mixed symbols (xy like)
    ['x y + x y', '2x * y'],
    ['2 x y + 3 x y', '5x * y'],

    // Short multiplication formulas
    ['(x + y)^2', 'x^2 + 2x * y + y^2'],
    ['(x - y)^2', 'x^2 - 2x * y + y^2'],
    ['(x + y)^3', 'x^3 + 3x^2 * y + 3x * y^2 + y^3'],
    ['(x - y)^3', 'x^3 - 3x^2 * y + 3x * y^2 - y^3'],
    ['(x + y)^10', 'x^10 + 10x^9 * y + 45x^8 * y^2 + 120x^7 * y^3 + 210x^6 * y^4 + 252x^5 * y^5 + 210x^4 * y^6 + 120x^3 * y^7 + 45x^2 * y^8 + 10x * y^9 + y^10'],
    ['(x - y)^10', 'x^10 - 10x^9 * y + 45x^8 * y^2 - 120x^7 * y^3 + 210x^6 * y^4 - 252x^5 * y^5 + 210x^4 * y^6 - 120x^3 * y^7 + 45x^2 * y^8 - 10x * y^9 + y^10'],

    // Short multiplication formulas: negative exponents.
    ['(x + y)^0'    , '1'],
    ['(x + y)^(-1)' , '1 / (x + y)'],
    ['(x + y)^(-2)' , '1 / (x^2 + 2x * y + y^2)'],
    ['(x + y)^(-10)', '1 / (x^10 + 10x^9 * y + 45x^8 * y^2 + 120x^7 * y^3 + 210x^6 * y^4 + 252x^5 * y^5 + 210x^4 * y^6 + 120x^3 * y^7 + 45x^2 * y^8 + 10x * y^9 + y^10)'],
    ['(x - y)^(-10)', '1 / (x^10 - 10x^9 * y + 45x^8 * y^2 - 120x^7 * y^3 + 210x^6 * y^4 - 252x^5 * y^5 + 210x^4 * y^6 - 120x^3 * y^7 + 45x^2 * y^8 - 10x * y^9 + y^10)'],

    // Other.
    ['a / ((b/c) * d)', 'a * c / (b * d)'],
    ['1/x - 1/x', '0'],
    ['1/x + 1/x', '2 / x'],
    ['1/x + 2/x', '3 / x'],
    ['2/x - 1/x', '1 / x'],

    // Trigonometric functions.
    ['-sin(0)'       , '0'],
    ['sin(const.pi/6)'     , '1/2'],
    ['sin(const.pi/4)'     , 'sqrt(2) / 2'],
    ['sin(const.pi/3)'     , 'sqrt(3) / 2'],
    ['sin(const.pi/2)'     , '1'],
    ['sin(const.pi)'       , '0'],
    ['-sin(0*x)'     , '0'],
    ['sin(-4 const.pi/24)' , '-1/2'],

    ['cos(0)'    , '1'],
    ['cos(const.pi/6)' , 'sqrt(3) / 2'],
    ['cos(const.pi/4)' , 'sqrt(2) / 2'],
    ['cos(const.pi/3)' , '1/2'],
    ['cos(const.pi/2)' , '0'],
    ['cos(const.pi)'   , '-1'],

    ['tg(0)'     , '0'],
    ['tg(const.pi/6)'  , 'sqrt(3) / 3'],
    ['tg(const.pi/4)'  , '1'],
    ['tg(const.pi/3)'  , 'sqrt(3)'],

    ['ctg(const.pi/6)' , 'sqrt(3)'],
    ['ctg(const.pi/4)' , '1'],
    ['ctg(const.pi/3)' , 'sqrt(3) / 3'],
    ['ctg(const.pi/2)' , '0'],

    ['atan(0)'         , '0'],
    ['atan(sqrt(3)/3)' , 'const.pi / 6'],
    ['atan(1)'         , 'const.pi / 4'],
    ['atan(sqrt(3))'   , 'const.pi / 3'],

    ['sin(n)^2 + cos(n)^2' , '1'],
    ['sin(-n)' , '-sin(n)'],
    ['cos(-n)' , 'cos(n)'],
    ['tg(-n)'  , '-tg(n)'],
    ['ctg(-n)' , '-ctg(n)'],

    // -------------------------------------------------------------------------
    // Cases from al_distribute_over_mult
    // Thanks to Anthony Liang (https://github.com/aliang8)
    // Originaly lived in distribute tests.
    ['(nthRoot(x, 2))^4', 'x^2'],
    ['(x y)^-1', '1 / (x * y)'],
    ['(x y)^-x', '1 / (x^x * y^x)'],
    ['(x y)^(-2x^2)', '1 / (x^(2x^2) * y^(2x^2))'],
    ['(x y)^(-(x + 1))', '1 / (x^(x + 1) * y^(x + 1))'],

    // When terms are polynomialTerms
    ['(x^2 y^2)^2', 'x^4 * y^4',],
    ['(x y)^2', 'x^2 * y^2'],
    ['(x y z)^2', 'x^2 * y^2 * z^2'],
    ['(x^2 y z^2)^2', 'x^4 * y^2 * z^4'],
    ['(x^2)^2', 'x^4'],

    // When terms have coefficients
    ['(2x y)^2', '4x^2 * y^2'],
    ['(2x^2 * 3y^2)^2', '36x^4 * y^4'],
    ['(x^2 * 3x * y^2)^3', '27x^9 * y^6'],
    // When terms are polynomials or power nodes
    ['((x + 1)^2 (x + 1)^2)^2', 'x^8 + 8x^7 + 28x^6 + 56x^5 + 70x^4 + 56x^3 + 28x^2 + 8x + 1'],
    // TODO: ['((x + y)^3 * (x + 1))^3', 'x^3 * (x^9 + 9x^8 * y + 36x^7 * y^2 + 84x^6 * y^3 + 126x^5 * y^4 + 126x^4 * y^5 + 84x^3 * y^6 + 36x^2 * y^7 + 9x * y^8 + y^9) + 3x^2 * (x^9 + 9x^8 * y + 36x^7 * y^2 + 84x^6 * y^3 + 126x^5 * y^4 + 126x^4 * y^5 + 84x^3 * y^6 + 36x^2 * y^7 + 9x * y^8 + y^9) + 3x * (x^3 + 3x^2 * y + 3x * y^2 + y^3) * (x^6 + 6x^5 * y + 15x^4 * y^2 + 20x^3 * y^3 + 15x^2 * y^4 + 6x * y^5 + y^6) + x^9 + 9x^8 * y + 36x^7 * y^2 + 84x^6 * y^3 + 126x^5 * y^4 + 126x^4 * y^5 + 84x^3 * y^6 + 36x^2 * y^7 + 9x * y^8 + y^9'],
    // TODO: ['((x + 1) (y + 1) (z + 1))^2', '(x + 1)^2 * (y + 1)^2 * (z + 1)^2'],

    // When terms are division nodes
    ['(x/y)^2', 'x^2 / y^2'],
    ['(2/3)^2', '4/9'],
    ['(-5/6)^2', '25/36'],
    ['((-5x)/7)^3', '-125/343*x^3'],
    ['((2x)/y)^3', '8x^3 / y^3'],
    ['((4x)/(5y))^3', '64x^3 / (125y^3)'],

    // Combination of terms
    ['(2x * (x + 1))^2', '4x^4 + 8x^3 + 4x^2'],
    ['((x + 1) * 2y^2 * 2)^2', '16x^2 * y^4 + 32x * y^4 + 16y^4'],

    // Works for decimal exponents too
    ['(x^2 y)^2.5', 'x^5 * y^(5/2)'],
    ['((x + 1) x^2)^2.2', '(x + 1)^(11/5) * x^(22/5)'], // TODO: (x^3 + x^2)^(11/5)

    // Convert nthRoot to exponent form
    ['nthRoot(x, 2)^3', 'x^(3/2)'],
    ['nthRoot(x, 2)^2', 'x'],
    ['nthRoot(x, 3)^2', 'x^(2/3)'],
    ['nthRoot(x^2, 2)^(1/2)', 'x^(1/2)'],

    // Multiplying nthRoots
    ['(nthRoot(x, 2) * nthRoot(x, 3))^2', 'x^(5/3)'],
    ['(nthRoot(x, 2)^2 * nthRoot(x, 2))^2', 'x^3'],

    // Does not change
    ['2^2', '4'],
    ['x^2', 'x^2'],
    ['x', 'x'],

    // -------------------------------------------------------------------------
    // Remove nested fractions.
    ['1/(2/3 c)'   , '3 / (2c)'],
    ['a/(b/c * d)' , 'a * c / (b * d)'],

    // -------------------------------------------------------------------------
    // Logarithms - general.
    ['logXY(x,y)', 'logXY(x, y)'],
    ['logXY(x,x)', '1'],
    ['logXY(x,1)', '0'],

    ['logXY(x, x^a)', 'a'],
    ['logXY(x, x^2)', '2'],
    ['logXY(x, x^-3)', '-3'],

    ['logXY(x, sqrt(x))', '1/2'],
    ['logXY(x, nthRoot(x,4))', '1/4'],

    ['logXY(a, b^c)', 'c * logXY(a, b)'],
    ['logXY(a, sqrt(b))', '1/2 * logXY(a, b)'],
    ['logXY(a, nthRoot(b,c))', 'logXY(a, b) / c'],

    // Logarithms - base 10.
    ['log10(x)', 'logXY(10, x)'],
    ['log10(10)', '1'],
    ['log10(1)', '0'],

    ['log10(10^a)', 'a'],
    ['log10(10^2)', '2'],
    ['log10(10^-3)', '-3'],

    ['log10(sqrt(10))', '1/2'],
    ['log10(nthRoot(10,4))', '1/4'],

    ['log10(b^c)', 'c * logXY(10, b)'],
    ['log10(sqrt(b))', '1/2 * logXY(10, b)'],
    ['log10(nthRoot(b,c))', 'logXY(10, b) / c'],

    // Logarithms - base e.
    ['logE(x)', 'logXY(const.e, x)'],
    ['logE(const.e)', '1'],
    ['logE(1)', '0'],

    ['logE(const.e^a)', 'a'],
    ['logE(const.e^2)', '2'],
    ['logE(const.e^-3)', '-3'],

    ['logE(sqrt(const.e))', '1/2'],
    ['logE(nthRoot(const.e,4))', '1/4'],

    ['logE(b^c)', 'c * logXY(const.e, b)'],
    ['logE(sqrt(b))', '1/2 * logXY(const.e, b)'],
    ['logE(nthRoot(b,c))', 'logXY(const.e, b) / c'],
  ]

  // Create fake symbolic context to handle domain for PI.
  // We know that PI is positive constant.
  // Possible improvement: default context if not set explicit.
  const ctx = {
    isNumerical: function() {
      return false
    },
    isNodeNonNegative: function(node) {
      let rv = false

      if ((node.type === 'AccessorNode') &&
          (node.object.name === 'const') &&
          (node.index.dimensions.length === 1) &&
          (node.index.dimensions[0].value === 'pi')) {
        // We know that pi constant is non-negative.
        rv = true
      }

      return rv
    }
  }

  tests.forEach(t => testSimplify(t[0], t[1], t[2], ctx))
})
