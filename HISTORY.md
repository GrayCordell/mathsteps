Sure, here's an improved version of your history section:

# History

## 2024-08-06, Version A1.0.0

The first version published by Grayson Cordell, a fork of the Calculla team's fork of the original mathsteps project.

### Introduction from Grayson / Vanderbilt Team

Hello, I am Grayson Cordell, a research engineer at Vanderbilt's Institute for Software Integrated Systems. I am working on a project that requires accessing and evaluating students' math steps. The primary intention of this fork is to facilitate this process. However, it is likely that improvements to the original code will also be necessary. The current name of this fork is TBD.

## 2020-07-23, version k1.0.0

The first version published by [Calculla](https://calculla.com) team.
This is the fork derived from **mathsteps 0.1.7** originaly created by **Evy Kassirer**.

### Introduction from Calculla team

We've started using mathsteps experimentally in Calculla's code in 2017. After a while we've started adding small extensions as well as additional tests and automation. Our fork diverged more and more from original mathsteps code as we had our own ideas for improvements and we've made technical decisions which may not be in line with original authors way of thinking (e.g. we've introduced _bignumber_ for constants accuracy). Also, the original project looks a bit abandoned.

With all this in mind, we've decided that instead of putting effort to merge back to original repo, we're gonna publish our changes as fork. If that works and current state persists, we're gonna move to separate repository (non-forked one) to avoid confusions. Also we added "k" to the version numbering to clearly state that is not exactly original versioning of mathsteps.

TLDR:

- this is diverged version of mathsteps, called kmathsteps
- version is now k1.0.0
- we will release it as separate npm package (soon)

#### Special thanks

Special thanks to:

- the team that actually built original mathsteps - we really like and appreciate your work
- Sylwester Wysocki (dzik-at-ke.mu) for his hard work pushing this forward

### General improvements

- Show parentheses removal as separate step,
- Initial support for user delivered **context** (symbolic vs numerical),
- All constants are stored as **bignumber rational** in **symbolic mode** e.g. _986/100_ instead of _9.86_,
- Values are presented as **bingumber decimals** in **numerical mode** e.g. _1.23_ instead of _123/100_,
- Initial support for **domains** e.g. _sqrt(a)_ gives _a_ if **a is positive** and _|a|_ in general case.

### New simplify steps:

_NOTE: we are going to clean up all "kemu" references from this code in next few chunks of changes. This was added initially to clearly distinguish the orignal code from our extensions, but is no longer needed._

- KEMU*REDUCE - better *(a b c ...)/(d e f ...)\_ cancelation,
- KEMU*MULTIPLY_SQRTS - \_sqrt(a) sqrt(b)* gives _sqrt(a b)_,
- KEMU*MULTIPLY_SQRTS_WITH_COMMON_ROOT - \_sqrt(a) sqrt(a)* gives _a_,
- KEMU*POWER_FACTORS - *(a b c ...)^x* gives \_ax bx cx ...*,
- KEMU*POWER_FRACTION - *(a/b)^x* gives \_a^x / b^x*,
- KEMU*POWER_SQRT - \_sqrt(a)^b* gives _a^(b/2)_,
- KEMU*SQRT_FROM_ZERO - \_sqrt(0)* gives _0_,
- KEMU*SQRT_FROM_ONE - \_sqrt(1)* gives _1_,
- KEMU*SQRT_FROM_POW - \_sqrt(x^2)* gives _|x|_ or _x_ etc.,
- KEMU*SQRT_FROM_CONST - \_sqrt(8)* gives _2 sqrt(2)_ etc.
- KEMU*POWER_TO_MINUS_ONE - *(a/b)^-1* gives \_b/a*,
- KEMU*POWER_TO_NEGATIVE_EXPONENT - \_x^-a* gives _1/(x^a)_ etc.,
- KEMU*MULTIPLY_EXPONENTS - *(a^x)^y* gives \_a^(x y)*,
- KEMU_REMOVE_UNNEDED_PARENTHESIS - show parenthesis remove as another step,
- KEMU*REMOVE_FRACTION_WITH_UNIT_NUMERATOR - *(a 1)/x* gives \_a/x*,
- KEMU*REMOVE_DOUBLE_FRACTION - \_x/y/z* gives *x/(y*z)\*,
- KEMU*NUMERICAL_SQRT - evaluate \_sqrt(a)* as decimal (non-fraction) e.g. _sqrt(3)_ gives _1.73205080756887729357..._,
- KEMU*NUMERICAL_DIV - evaluate \_a/b* as decimal (non-fraction) e.g. _1/3_ gives _0.3333333333333333333..._,
- KEMU*FACTOR_EXPRESSION_UNDER_ROOT - \_sqrt(8)* gives *sqrt(4*2)\* etc.,
- KEMU*DECIMAL_TO_FRACTION - \_3.14* gives _314/100_ etc.,

- KEMU*SHORT_MULTIPLICATION_AB2_ADD - *(a+b)^2* gives \_a^2 + 2ab + b^2*,
- KEMU*SHORT_MULTIPLICATION_AB3_ADD - *(a+b)^3* gives \_a^3 + 3a^2b + 3ab^2 + b^3*,
- KEMU*SHORT_MULTIPLICATION_ABN_ADD - general case for integer n: *(a+b)^n\_,

- KEMU*SHORT_MULTIPLICATION_AB2_SUB - *(a-b)^2* gives \_a^2 - 2ab + b^2*,
- KEMU*SHORT_MULTIPLICATION_AB3_SUB - *(a-b)^3* gives \_a^3 − 3a^2b +3ab^2 − b^3*,
- KEMU*SHORT_MULTIPLICATION_ABN_SUB - general case for integer n: *(a-b)^n\_,

- KEMU*FUNCTION_VALUE - evaluate of known function e.g. \_sin(pi/2)* gives _1_,
- KEMU*PYTHAGOREAN_IDENTITY - \_sin(x)^2 + sin(x)^y* gives _1_,
- KEMU*EVEN_FUNCTION_OF_NEGATIVE - \_cos(-x)* gives _cos(x)_ etc.,
- KEMU*ODD_FUNCTION_OF_NEGATIVE - \_sin(-x)* gives _-sin(x)_ etc.,
- KEMU*CONVERT_SIN_PER_COS_TO_TAN - \_sin(x)/cos(x)* gives _tan(x)_,
- KEMU*CONVERT_COS_PER_SIN_TO_COT - \_cos(x)/sin(x)* gives _cot(x)_,
- KEMU*CANCEL_INVERSE_FUNCTION - \_atan(tan(x))* gives _x_ etc..

### Internal maintenance

- Adjusted to work with _mathjs 7.1.0_,
- Improved code formatting,
- All constants are stored as _bignumber_,
- Ability to write rules using _mathjs_ notation directly (see [example](https://github.com/kemu-studio/mathsteps/blob/sync-with-calculla/lib/simplifyExpression/kemuCommonSearch/commonFunctions.js)), this is prefered way to add new rules if possible,
- Better args sorting for expression comparison,
- Better _flip-flop_ detection (_a -> b -> a -> b -> a -> ..._),
- Results caching,

# Original history of math-steps up to 0.1.7

All history entries below have been copied from _original mathsteps 0.1.7_ initiated by **Evy Kassirer**.
Please visit https://github.com/google/mathsteps for more.

## 2017-10-26, version 0.1.7

There's been a lot of great changes since the last release, here are the main updates

Functionality and Teaching Enhancements:

- new pedagogy for multiply powers integers #153
- exposing the factoring module and adding more coverage #148
- simplify roots of any degree #183
- more cases for cancelling terms #182
- greatest common denominator substep #188
- multiply nthRoots #189
- multiply fractions with parenthesis #185
- remove unnecessary parens before solving equations #205
- multiply denominators with terms #88
- Better sum-product factoring steps #210

Bug Fixes

- fix the check for perfect roots of a constant when there's roundoff error #224
- large negtive number rounding #216

Other:

- (code structure) generalizing polynomial terms #190
- latex printing for equations
- added linting rules #222

## 2017-04-03, version 0.1.6

updated mathjs to incorporate vulnerability patch #149

Functionality Enhancements:

- Added factoring support #104
- Fixed #138: Better handling of distribution with fractions. Thanks @lexiross !
- Fixed #126: Add parens in util > print where necessary. Thanks @Flyr1Q !

Bug fixes:

- Fixed #113: handle exponents on coefficients of polynomial terms. Thanks @shirleymiao !
- Fixed #111 (nthRoot() existence check). Thanks @shirleymiao !

Refactoring + Documentation + other dev enhancements:

- Fixed #107: Improve our linter. Thanks @Raibaz !
- Added Travis continuous integration
- Refactor test to use TestUtil. Thanks @nitin42 !
- Work on #58: Adding missing tests. Thanks @nitin42 !

## 2017-01-29, version 0.1.5

Reverted #82 (Added script to check the installed node version) and mention
node version requiremnts in the README.

## 2017-01-29, version 0.1.4

Functionality Enhancements:

- Fixed #39: Add rule to simplify 1^x to 1. Thanks @michaelmior !
- Fixed #82: Added script to check the installed node version. Thanks @Raibaz !

Bug fixes:

- Fixed #77: bug where oldNode was null on every step. Thanks @hmaurer !
- Handle unary minus nodes that have an argument that is a parentheses. Thanks
  @tkosan !

Refactoring + Documentation + other dev enhancements:

- Fixed #73: replace New Kids on the Block video with one that's not restricted
  in most of the world
- Fixed #80: Use object literal property value shorthand. Thanks @cspanda !
- Fixed #62: Separated basicsSearch simplifications into their own files. Thanks
  @Raibaz !
- Fixed #78: pre-commit hook to run tests and linter before a git commit. Thanks
  @hmaurer !
- Improvements from #44: Added Linting rules. Thanks @biyasbasak !
- Fixed #91: Refactor isOperator to accept operator parameter. Thanks
  @mcarthurgill !
- Fixed #86: Clean up CONTRIBUTING.md. Thanks @faheel !
- Fixed #34: Make a helper function getRadicandNode. Thanks @lexiross !
- Fixed #95: Create RESOURCES.md for people to share relevant software,
  projects, and papers
- Fixed #102: Add a complete code example for solving an equation. Thanks
  @karuppiah7890 !
