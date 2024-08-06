# Mathsteps - Experimental Fork (Name TBD)

This is an experimental fork of Kemu Studio's [mathsteps](https://github.com/kemu-studio/mathsteps), a step-by-step solver for math problems. This fork introduces several significant changes and improvements:

## Major Changes & Future Changes

- **Converted CommonJS to ESM**: Modernized the module system.
- **Added TypeScript/JSDoc Support**: Enhanced code quality and developer experience.
- **Optimized for Browser Use**: Tailored for better performance in web environments.
- **Modernized ESLint Configuration**: Ensured code adheres to contemporary JavaScript standards.

Considering the extensive changes and my limited familiarity with some of the original code's intentions, merging this fork back into the main mathsteps repository might not be feasible. However, it remains a possibility for the future. KemuStudios is free to contact me if they think my future work could benefit the main project.

## New Project Focus

The primary goal of this fork is to add an ability to evaluate users' steps in solving math problems and diagnose where they might have gone wrong. The current implementation uses existing solving rules to find all possible next steps. This feature is still a work in progress and may not yet be highly performant.

Check out `main.js` to see the current implementation of this feature in action.

## Installation

1. Clone this repository:
   ```sh
   git clone <repository-url>
   ```
2. Install all dependencies:
   ```sh
   pnpm install
   ```

## Usage for Evaluating User Steps (Work in Progress)

1. Modify the `usersteps` array in `main.js` to include the desired user steps.
2. Run the development server:
   ```sh
   pnpm dev
   ```
   Check the console for the current output.

For more information on solving math problems using mathsteps, see the examples below:

## Code Examples

### Simplifying an Expression

```javascript
let steps = [];
const newNode = mathsteps.simplifyExpression({
  expressionAsText: '2x + 2x + x + x',
  onStepCb: (step) => {
    steps.push(step);

    // Uncomment the following lines to see alternate forms
    // if (stepMeta.altForms) {
    //   console.log('ALT FORM:', mathsteps.printAsTeX(stepMeta.altForms[0].node));
    //   console.log(stepMeta.altForms[0].node);
    // }
  }
});

steps.forEach(step => {
  console.log("change: " + step.changeType); // change: ADD_POLYNOMIAL_TERMS
  console.log("after change: " + mathsteps.printAsTeX(step.rootNode)); // after change: 6x
});
```

### Simplifying an Equation

```javascript
const steps = [];
const eventualAnswer = mathsteps.simplifyExpression({
  expressionAsText: userStep,
  isDebugMode: false,
  onStepCb: (step) => {
    steps.push(step);
  }
});
```

### Solving an Equation

```javascript
const result = mathsteps.solveEquation({
  equationAsText: '2x + 3x = 35',
  unknownVariable: 'x',
  onStepCb: function(step) {
    console.log(`[ ${step.equation.getId()} ] ${step.stepId} | ${step.equation}`);
  }
});
```

Feel free to contribute, open issues, or suggest improvements. I'd love for this project to be a collaborative effort, and your input is highly valued!

---
