import { math } from "~/config.js";
const NodeType = {};
const NODE_TWO = new math.ConstantNode(math.bignumber(2));
NodeType.isOperator = function (node, operator = null) {
    return node.type === 'OperatorNode' &&
        node.fn !== 'unaryMinus' &&
        '*+-/^'.includes(node.op) &&
        (operator ? node.op === operator : true);
};
NodeType.isUnaryMinus = function (node) {
    return node.type === 'OperatorNode' && node.fn === 'unaryMinus';
};
NodeType.isFunction = function (node, functionName = null) {
    if (node.type !== 'FunctionNode') {
        return false;
    }
    if (functionName && (node.fn.name !== functionName)) {
        return false;
    }
    return true;
};
NodeType.isNthRoot = function (node) {
    return NodeType.isFunction(node, 'nthRoot') ||
        NodeType.isFunction(node, 'sqrt');
};
// Given an nthRoot node, will return the root node.
// The root node is the second child of the nthRoot node, but if one doesn't
// exist, we assume it's a square root and return 2.
NodeType.getRootNode = function (node) {
    if (NodeType.isFunction(node, 'nthRoot')) {
        return node.args.length === 2 ? node.args[1] : NODE_TWO;
    }
    else if (NodeType.isFunction(node, 'sqrt')) {
        return NODE_TWO;
    }
    else {
        throw Error('Expected nthRoot or sqrt');
    }
};
// Given an nthRoot node, will return the radicand node.
NodeType.getRadicandNode = function (node) {
    if (NodeType.isNthRoot(node)) {
        return node.args[0];
    }
    else {
        throw Error('Expected nthRoot or sqrt');
    }
};
NodeType.isSymbol = function (node, allowUnaryMinus = false) {
    if (node.type === 'SymbolNode') {
        return true;
    }
    else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
        return NodeType.isSymbol(node.args[0], false);
    }
    else if ((node.type === 'AccessorNode') &&
        (node.object.name === 'const') &&
        (node.index.dimensions.length === 1)) {
        // Built-in constant: const.pi like.
        return true;
    }
    else {
        return false;
    }
};
NodeType.isNamedSymbol = function (node, expectedName) {
    return (node.type === 'SymbolNode') &&
        (node.name === expectedName);
};
NodeType.isConstant = function (node, allowUnaryMinus = false) {
    if (node.type === 'ConstantNode') {
        return true;
    }
    else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
        if (NodeType.isConstant(node.args[0], false)) {
            return math.isNumeric(node.args[0].value);
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
};
// Function branch from al_mixed_numbers
// TODO: Review is it still useful?
NodeType.isMixedNumber = function (node, allowUnaryMinus = false) {
    if (node.op === '*'
        && NodeType.isConstant(node.args[0])
        && (node.args[1].type === 'ParenthesisNode')
        && NodeType.isConstantFraction(node.args[1].content)) {
        return true;
    }
    return false;
};
NodeType.isConstantFraction = function (node, allowUnaryMinus = false) {
    if (NodeType.isOperator(node, '/')) {
        return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus));
    }
    else {
        return false;
    }
};
NodeType.isConstantOrConstantFraction = function (node, allowUnaryMinus = false) {
    if (NodeType.isConstant(node, allowUnaryMinus) ||
        NodeType.isConstantFraction(node, allowUnaryMinus)) {
        return true;
    }
    else {
        return false;
    }
};
NodeType.isIntegerFraction = function (node, allowUnaryMinus = false) {
    if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
        return false;
    }
    let numerator = node.args[0];
    let denominator = node.args[1];
    if (allowUnaryMinus) {
        if (NodeType.isUnaryMinus(numerator)) {
            numerator = numerator.args[0];
        }
        if (NodeType.isUnaryMinus(denominator)) {
            denominator = denominator.args[0];
        }
    }
    return (math.isInteger(numerator.value) &&
        math.isInteger(denominator.value));
};
NodeType.kemuIsConstantInteger = function (node, expectedValue) {
    const isConstant = (node.type === 'ConstantNode');
    if (expectedValue != null) {
        return isConstant && math.equal(node.value, expectedValue);
    }
    else {
        return isConstant && math.isInteger(node.value);
    }
};
NodeType.isZero = function (node) {
    return NodeType.isConstant(node) && math.isZero(node.value);
};
NodeType.kemuIsConstantNegative = function (node) {
    return (node.type === 'ConstantNode') && math.isNegative(node.value);
};
NodeType.kemuIsConstantPositive = function (node) {
    return (node.type === 'ConstantNode') && math.isPositive(node.value);
};
NodeType.kemuIsConstantOrSymbol = function (node) {
    return NodeType.isConstant(node) || NodeType.isSymbol(node);
};
NodeType.doesContainSymbol = function (node, symbolName) {
    const stamp = '_containsSymbol_' + symbolName;
    let rv = node[stamp];
    if (rv == null) {
        // Node checked first time. Go on.
        if (NodeType.isSymbol(node)) {
            rv = node.name === symbolName;
        }
        else if (NodeType.isConstant(node)) {
            rv = false;
        }
        else {
            rv = false;
            for (let idx in node.args) {
                rv = NodeType.doesContainSymbol(node.args[idx], symbolName);
                if (rv) {
                    // At least one arg contains searched symbol.
                    // Don't go on anymore.
                    break;
                }
            }
        }
        // Save result for further calls.
        node[stamp] = rv;
    }
    return rv;
};
NodeType.isPowerOfSymbol = function (node) {
    // x^(...)
    return NodeType.isOperator(node, '^') &&
        NodeType.isSymbol(node.args[0]);
};
NodeType.isSymbolOrPowerOfSymbol = function (node) {
    // x
    // x^(...)
    return NodeType.isSymbol(node) || NodeType.isPowerOfSymbol(node);
};
NodeType.isPolynomialTerm = function (node) {
    let rv = true;
    if (NodeType.isSymbolOrPowerOfSymbol(node)) {
        // x
        // x^n
    }
    else if (NodeType.isUnaryMinus(node) &&
        NodeType.isSymbolOrPowerOfSymbol(node.args[0])) {
        // -x
        // -x^n
    }
    else if (NodeType.isOperator(node, '*') &&
        (node.args.length === 2) &&
        NodeType.isConstantOrConstantFraction(node.args[0]) &&
        NodeType.isSymbolOrPowerOfSymbol(node.args[1])) {
        // c * x
        // c * x^n
    }
    else if (NodeType.isOperator(node, '/') &&
        (node.args.length === 2) &&
        NodeType.isConstantOrConstantFraction(node.args[1])) {
        // x     / c
        // x^n   / c
        // c x   / c
        // c x^n / c
    }
    else {
        // Unmatched - not a polynomial term.
        rv = false;
    }
    return rv;
};
export default NodeType;
