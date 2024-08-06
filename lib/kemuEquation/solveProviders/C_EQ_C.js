import Node from "../../node/index.js";
import stepThrough from "../../simplifyExpression/index.js";
const NODE_TRUE = Node.Creator.symbol('true');
const NODE_FALSE = Node.Creator.symbol('false');



export const C_EQ_C = {
    id: 'C_EQ_C',
    pattern:'C=C',
    solveFunction: (equation) => {
        // Simplify both side before step.
        equation.simplifyLeft();
        equation.simplifyRight();
        // Fetch LR nodes.
        const leftNode = equation.left.node;
        const rightNode = equation.right.node;
        // Try to calculate L-R difference.
        const diffNode = stepThrough.newApi(Node.Creator.operator('-', [leftNode, rightNode]));
        if (Node.Type.isConstant(diffNode)) {
            // L - R gives a constant number.
            // We can check equality directly.
            if (Node.Type.isZero(diffNode)) {
                // L - R = 0
                // Solution is true.
                equation.applySolution([NODE_TRUE]);
            }
            else {
                // L - R != 0
                // Solution is false.
                equation.applySolution([NODE_FALSE]);
            }
        }
        else {
            // L - R is NOT a constant.
            // Give up. We stuck WITHOUT solution.
            // Possible improvement: Handle function nodes e.g. sin(1) = pi
            // Possible improvement: Handle parameter dependend e.g. n=1
        }
    }
}
