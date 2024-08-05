import Node from "../node/index.js";
import resolvesToConstant from "./resolvesToConstant.js";
// Possible improvement: handle more functions.
const KEMU_POOL_OF_ONE_ARG_FUNCTIONS = [
    // Trigonometry: basic
    'sin', 'cos', 'tan', 'tg', 'ctg', 'cot', 'sec', 'csc', 'cosec',
    // Trigonometry: arc-functions
    'arcsin', 'asin', 'arccos', 'acos', 'arctg', 'atan', 'arcctg', 'acot',
    'arctan', 'arccot',
    // Other
    'exp', 'sqrt', 'percent'
];
const KEMU_POOL_OF_TWO_ARGS_FUNCTIONS = [
    'logXY',
];
// We keep original names (given by user) for presentation, but
// normalize internal function names for calculations to avoid
// ctg vs cot like issues.
const KEMU_FUNCTION_NAMES_FOR_CALCULATIONS = {
    tan: 'tg',
    cot: 'ctg',
    cosec: 'csc',
    arcsin: 'asin',
    arccos: 'acos',
    arctg: 'atan',
    arcctg: 'acot',
    arctan: 'atan',
    arccot: 'acot',
};
function hasUnsupportedNodes(node) {
    if (node == null) {
        return true;
    }
    else if (Node.Type.isUnaryMinus(node)) {
        return hasUnsupportedNodes(node.args[0]);
    }
    else if (Node.Type.isOperator(node)) {
        return node.args.some(hasUnsupportedNodes);
    }
    else if (Node.Type.isSymbol(node) || Node.Type.isConstant(node)) {
        return false;
    }
    else if (Node.Type.isFunction(node, 'abs')) {
        if (node.args.length !== 1) {
            return true;
        }
        if (node.args.some(hasUnsupportedNodes)) {
            return true;
        }
        return !resolvesToConstant(node.args[0]);
    }
    else if ((Node.Type.isFunction(node)) &&
        (KEMU_POOL_OF_ONE_ARG_FUNCTIONS.indexOf(node.fn.name) !== -1)) {
        // One of known one argument functions e.g. sin(x).
        let rv = node.args.some(hasUnsupportedNodes) || (node.args.length !== 1);
        if (!rv) {
            // Keep original name (given by user) for presentation.
            node.fn.nameForPresentation = node.fn.name;
            // Normalize function name for calculations if needed.
            const nameForCalculations = KEMU_FUNCTION_NAMES_FOR_CALCULATIONS[node.fn.name];
            if (nameForCalculations) {
                node.fn.name = nameForCalculations;
            }
        }
        return rv;
    }
    else if ((Node.Type.isFunction(node)) &&
        (KEMU_POOL_OF_TWO_ARGS_FUNCTIONS.indexOf(node.fn.name) !== -1)) {
        // Possible improvement: Avoid code duplication (1 vs 2 args functions).
        // One of known two arguments functions e.g. sin(x).
        let rv = node.args.some(hasUnsupportedNodes) || (node.args.length !== 2);
        if (!rv) {
            // Keep original name (given by user) for presentation.
            node.fn.nameForPresentation = node.fn.name;
            // Normalize function name for calculations if needed.
            const nameForCalculations = KEMU_FUNCTION_NAMES_FOR_CALCULATIONS[node.fn.name];
            if (nameForCalculations) {
                node.fn.name = nameForCalculations;
            }
        }
        return rv;
    }
    else if (Node.Type.isNthRoot(node)) {
        return node.args.some(hasUnsupportedNodes) || (node.args.length < 1) || (node.args[0] == null);
    }
    else {
        return true;
    }
}
export default hasUnsupportedNodes;
