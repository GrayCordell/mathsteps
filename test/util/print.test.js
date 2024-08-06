import Node from "~/node/index.js";
import print from "~/util/print.js";
import mathsteps from "~/index.js";
import TestUtil from "../TestUtil.js";
import { afterEach, beforeEach,assert, describe, expect } from 'vitest'

// to create nodes, for testing
const opNode = Node.Creator.operator
const constNode = Node.Creator.constant
const symbolNode = Node.Creator.symbol

function testPrintStr(exprStr, outputStr) {
  const input = mathsteps.parseText(exprStr)
  TestUtil.testFunctionOutput(print.ascii, input, outputStr)
}

function testLatexPrintStr(exprStr, outputStr) {
  const input = TestUtil.parseAndFlatten(exprStr)
  TestUtil.testFunctionOutput(print.latex, input, outputStr)
}

function testPrintNode(node, outputStr) {
  TestUtil.testFunctionOutput(print.ascii, node, outputStr)
}

describe('print asciimath', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + 4 - x - 4'],
    ['2/3 x^2', '2/3x^2'],
    ['-2/3', '-2/3'],
  ]
  tests.forEach(t => testPrintStr(t[0], t[1]))
})

describe('print latex', function() {
  const tests = [
    ['2+3+4', '2+3+4'],
    ['2 + (4 - x) - 4', '2+4-x-4'],
    ['2/3 x^2', '\\frac{2}{3}~x^{2}'],
    ['-2/3', '\\frac{-2}{3}'],
    ['2*x+4y', '2~x+4~y'],

    // Built-in constant (const.e) vs ordinary user-defined symbol (e).
    ['const.pi + pi' , '\\boxed{\\pi}+\\pi'],
    ['const.e + e'   , '\\boxed{e}+e'],

    // Logarithms.
    ['logXY(a, b)' , '\\log_{a}{\\mathrm{b}}'],
    ['log10(x)'    , '\\log_{10}{x}'],
    ['logE(y)'     , '\\log_{\\boxed{e}}{y}'],
  ]
  tests.forEach(t => testLatexPrintStr(t[0],t[1]))
})

describe('print with parenthesis', function () {
  const tests = [
    [opNode('*', [
      opNode('+', [constNode(2), constNode(3)]),
      symbolNode('x')
    ]), '(2 + 3) * x'],
    [opNode('^', [
      opNode('-', [constNode(7), constNode(4)]),
      symbolNode('x')
    ]), '(7 - 4)^x'],
    [opNode('/', [
      opNode('+', [constNode(9), constNode(2)]),
      symbolNode('x')
    ]), '(9 + 2) / x'],
  ]
  tests.forEach(t => testPrintNode(t[0], t[1]))
})
