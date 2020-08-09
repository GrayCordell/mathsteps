
const assert = require('assert')

const ChangeTypes = require('../../lib/ChangeTypes')
const solveEquation = require('../../lib/solveEquation')

const NO_STEPS = 'no-steps'

function testSolve(equationString, outputStr, debug = false) {
  const steps = solveEquation(equationString, debug)
  let lastStep
  if (steps.length === 0) {
    lastStep = NO_STEPS
  } else {
    lastStep = steps[steps.length - 1].newEquation.ascii()
  }
  it(equationString + ' -> ' + outputStr, (done) => {
    assert.equal(lastStep, outputStr)
    done()
  })
}

describe('solveEquation for =', function () {
  const tests = [
    ['g *( x ) = ( x - 4) ^ ( 2) - 3', 'g = x - 8 + 13 / x'],

    // can't solve this because we don't deal with inequalities yet
    // See: https://www.cymath.com/answer.php?q=(%20x%20)%2F(%202x%20%2B%207)%20%3E%3D%204
    ['( x )/( 2x + 7) >= 4', NO_STEPS],
    ['y - x - 2 = 3*2', 'y = 8 + x'],
    ['2y - x - 2 = x', 'y = x + 1'],
    ['x = 1', NO_STEPS],
    ['2 = x', 'x = 2'],
    ['2 + -3 = x', 'x = -1'],
    ['x + 3 = 4', 'x = 1'],
    ['2x - 3 = 0', 'x = 3/2'],
    ['x/3 - 2 = -1', 'x = 3'],
    ['5x/2 + 2 = 3x/2 + 10', 'x = 8'],
    ['2x - 1 = -x', 'x = 1/3'],
    ['2 - x = -4 + x', 'x = 3'],
    ['2x/3 = 2', 'x = 3'],
    ['2x - 3 = x', 'x = 3'],
    ['8 - 2a = a + 3 - 1', 'a = 2'],
    ['2 - x = 4', 'x = -2'],
    ['2 - 4x = x', 'x = 2/5'],
    ['9x + 4 - 3 = 2x', 'x = -1/7'],
    ['9x + 4 - 3 = -2x', 'x = -1/11'],

    // 2 test cases from al_distribute_over_mult
    ['(2x^2 - 1)(x^2 - 5)(x^2 + 5) = 0', 'x = [-1 / sqrt(2), 1 / sqrt(2), -nthRoot(5, 2), nthRoot(5, 2)]'],
    // Possible improvement: Fallback to generic delta scheme (-b^2/4ac) ?
    // TODO: Partial result: ['(-x ^ 2 - 4x + 2)(-3x^2 - 6x + 3) = 0', '3x^4 + 18x^3 + 15x^2 - 24x = -6'],

    ['5x + (1/2)x = 27 ', 'x = 54/11'],
    ['2x/3 = 2x - 4 ', 'x = 3'],
    ['(-2/3)x + 3/7 = 1/2', 'x = -3/28'],
    ['(-9/4)v + 4/5 = 7/8', 'v = -1/30'],
    ['x^2 - 2 = 0', 'x = [-nthRoot(2, 2), nthRoot(2, 2)]'],
    ['x/(2/3) = 1', 'x = 2/3'],
    ['(x+1)/3 = 4', 'x = 11'],
    ['2(x+3)/3 = 2', 'x = 0'],
    ['( u )/( 0.3) = 4u + 6.28', 'u = -471/50'],

    ['- q - 4.36= ( 2.2q )/( 1.8)', 'q = -981/500'],
    ['5x^2 - 5x - 30 = 0', 'x = [-2, 3]'],
    ['x^2 + 3x + 2 = 0', 'x = [-1, -2]'],
    ['x^2 - x = 0', 'x = [0, 1]'],
    ['x^2 + 2x - 15 = 0', 'x = [3, -5]'],
    ['x^2 + 2x = 0', 'x = [0, -2]'],
    ['x^2 - 4 = 0', 'x = [-2, 2]'],

    // Perfect square
    ['x^2 + 2x + 1 = 0', 'x = [-1, -1]'],
    ['x^2 + 4x + 4 = 0', 'x = [-2, -2]'],
    ['x^2 - 6x + 9 = 0', 'x = [3, 3]'],
    ['(x + 4)^2 = 0', 'x = [-4, -4]'],
    ['(x - 5)^2 = 0', 'x = [5, 5]'],

    // Difference of squares
    ['4x^2 - 81 = 0', 'x = [-9 / 2, 9 / 2]'],
    ['x^2 - 9 = 0', 'x = [-3, 3]'],
    ['16y^2 - 25 = 0', 'y = [-5 / 4, 5 / 4]'],

    // Some weird edge cases (we only support a leading term with coeff 1)
    ['x * x + 12x + 36 = 0', 'x = [-6, -6]'],
    ['x * x - 2x + 1 = 0', 'x = [1, 1]'],
    ['0 = x^2 + 3x + 2', 'x = [-1, -2]'],
    ['0 = x * x + 3x + 2', 'x = [-1, -2]'],
    ['x * x + (x + x) + 1 = 0', 'x = [-1, -1]'],
    ['0 = x * x + (x + x) + 1', 'x = [-1, -1]'],
    ['(x^3 / x) + (3x - x) + 1 = 0', 'x = [-1, -1]'],
    ['0 = (x^3 / x) + (3x - x) + 1', 'x = [-1, -1]'],

    // Solve for roots before expanding
    ['2^7 (x + 2) = 0', 'x = -2'],
    ['(x + y) (x + 2) = 0', 'x = [-y, -2]'],
    ['(33 + 89) (x - 99) = 0', 'x = 99'],
    ['(x - 1)(x - 5)(x + 5) = 0', 'x = [1, 5, -5]'],
    ['x^2 (x - 5)^2 = 0', 'x = [0, 0, 5, 5]'],
    ['x^2 = 0', 'x = [0, 0]'],
    ['x^(2) = 0', 'x = [0, 0]'],
    ['(x+2)^2 -x^2 = 4(x+1)', '4 = 4'],

    // -------------------------------------------------------------------------
    // Imported from https://github.com/google/mathsteps/tree/al_more_roots
    // Thanks to Anthony Liang (https://github.com/aliang8)
    // Nth root support
    ['x^2 - 2 = 0', 'x = [-nthRoot(2, 2), nthRoot(2, 2)]'],
    ['x^2 - 1 = 0', 'x = [-1, 1]'],
    ['x^2 = 1', 'x = [-1, 1]'],
    ['x^3 - 3 = 0', 'x = [nthRoot(3, 3), nthRoot(3, 3), nthRoot(3, 3)]'],
    ['(x^2 - 2) (x^2 - 5) = 0', 'x = [-nthRoot(2, 2), nthRoot(2, 2), -nthRoot(5, 2), nthRoot(5, 2)]'],
    ['(x^2 + 2) (x^3 - 7) = 0', 'x = [nthRoot(7, 3), nthRoot(7, 3), nthRoot(7, 3)]'],
    ['x^2 + 1 = 0', 'x = []'], // No real solutions
    ['(y + 1)^2 = 1', 'y = [0, -2]'],
    ['(y + 1)^3 = 8', 'y = 1'],
    ['(2x + 1)^3 = 1', 'x = 0'],
    ['(3x + 2)^2 = 2', 'x = [sqrt(2) / 3 - 2 / 3, -sqrt(2) / 3 - 2 / 3]'],
    // TODO: Too many steps: ['(3x + 2)^2 + 2 = 1']
    // -------------------------------------------------------------------------

    // 1 test case from https://github.com/google/mathsteps/tree/al_distribute_over_mult
    // Thanks to Lili Dworkin (https://github.com/ldworkin)
    ['x - 3.4= ( x - 2.5)/( 1.3)', 'x = 32/5'],

    ['2/x = 1', 'x = 2'],
    ['2/(4x) = 1', 'x = 1/2'],
    ['2/(8 - 4x) = 1/2', 'x = 1'],
    ['2/(1 + 1 + 4x) = 1/3', 'x = 1'],
    ['(3 + x) / (x^2 + 3) = 1', 'x = [0, 1]'],
    ['6/x + 8/(2x) = 10', 'x = 1'],

    // Imported from https://github.com/florisdf/mathsteps/blob/master/test/solveEquation/solveEquation.test.js
    // Thanks to Floris (https://github.com/florisdf)
    ['(x+1)=4', 'x = 3'],
    ['((x)/(4))=4', 'x = 16'],

    // Imported from: https://github.com/GabrielMahan/mathsteps/blob/master/test/solveEquation/solveEquation.test.js
    // Thanks to Gabriel Mahan (https://github.com/GabrielMahan)
    ['(2x-12)=(x+4)', 'x = 16'],
    ['x+y=x+y', '0 = 0'],
    ['y + 2x = 14 + y', 'x = 7'],
    ['((1)/(2+1)) = ((1)/(3))', '1/3 = 1/3'],
    ['-((1)/(3)) = ((-1)/(3))', '-1/3 = -1/3'],
    ['-(x/2)=3', 'x = -6'],
    ['44x=2.74', 'x = 137/2200'],

    // Possible improvement: Possibility to point unknown variable directly?
    ['(x + y) (y + 2) = 0', 'x = -y'],      // Solve for x (first found symbol)
    ['(y + x) (y + 2) = 0', 'y = [-x, -2]', // Solve for y (first found symbol)

    // Possible improvement: Skip repeated solutions.
    ['((x-2)^2) = 0', 'x = [2, 2]'],

    // Possible improvement: don't treat x (...) as function call?
    // Possible improvement: x (x - 5) vs x  * (x - 5)
    ['x * x * (x - 5)^2 = 0', 'x = [0, 0, 5, 5]'],

    ['x^6 - x = 0', 'x = [0, 1]'],
    ['4x^2 - 25y^2 = 0', 'x = [-5 / 2 * y, 5 y / 2]'],
    ['(x^2 + 2x + 1) (x^2 + 3x + 2) = 0', 'x = [-1, -1, -1, -2]'],
    ['(2x^2 - 1)(x^2 - 5)(x^2 + 5) = 0', 'x = [-1 / sqrt(2), 1 / sqrt(2), -nthRoot(5, 2), nthRoot(5, 2)]'],
    // TODO: Too many steps: ['(-x ^ 2 - 4x + 2)(-3x^2 - 6x + 3) = 0', ''],
    ['x^2 = -2x - 1', 'x = [-1, -1]'],
    ['x - 3.4= ( x - 2.5)/( 1.3)', 'x = 32/5']
  ]

  tests.forEach((t) => {
    testSolve(t[0], t[1], t[2])
  })
})

describe('solveEquation for non = comparators', function() {
  const tests = [
    ['x + 2 > 3', 'x > 1'],
    ['2x < 6', 'x < 3'],
    ['-x > 1', 'x < -1'],
    ['2 - x < 3', 'x > -1'],
    ['9.5j / 6+ 5.5j >= 3( 5j - 2)', 'j <= 72/95']
  ]
  tests.forEach(t => testSolve(t[0], t[1], t[2]))
})

function testSolveConstantEquation(equationString, expectedChange, debug = false) {
  const steps = solveEquation(equationString, debug)
  const actualChange = steps[steps.length - 1].changeType
  it(equationString + ' -> ' + expectedChange, (done) => {
    assert.equal(actualChange, expectedChange)
    done()
  })
}

describe('constant comparison support', function () {
  const tests = [
    ['1 = 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['3 + 5 = 8', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 = 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 - 3 = 5', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 > 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2/3 > 1/3', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 > 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['1/3 > 2/3', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 >= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2 >= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 >= 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 < 1', ChangeTypes.STATEMENT_IS_FALSE],
    ['2/3 < 1/3', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 < 2', ChangeTypes.STATEMENT_IS_TRUE],
    ['1/3 < 2/3', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 <= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2 <= 1', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 <= 2', ChangeTypes.STATEMENT_IS_TRUE],
    ['( 1) = ( 14)', ChangeTypes.STATEMENT_IS_FALSE],
    ['0 = 0', ChangeTypes.STATEMENT_IS_TRUE],
    ['(1/64)^(-5/6) = 32', ChangeTypes.STATEMENT_IS_TRUE],
    // With variables that cancel
    ['( r )/( ( r ) ) = ( 1)/( 10)', ChangeTypes.STATEMENT_IS_FALSE],
    ['5 + (x - 5) = x', ChangeTypes.STATEMENT_IS_TRUE],
    ['4x - 4= 4x', ChangeTypes.STATEMENT_IS_FALSE],
  ]
  tests.forEach(t => testSolveConstantEquation(t[0], t[1], t[2]))
})

function testEquationError(equationString, debug = false) {
  it(equationString + ' throws error', (done) => {
    assert.throws(() => solveEquation(equationString, debug),Error)
    done()
  })
}

describe('solveEquation errors', function() {
  const tests = [
    // One case from al_factoring
    ['( x + 2) ^ ( 2) - x ^ ( 2) = 4( x + 1)']
  ]
  // TODO: Review it: tests.forEach(t => testEquationError(t[0], t[1]))
})
