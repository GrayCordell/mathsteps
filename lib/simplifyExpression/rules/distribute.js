import ChangeTypes from "../../ChangeTypes.js";
import Node from "../../node/index.js";
import clone from "../../util/clone.js";
const DISTRIBUTE_MAP = {
    // Distribute power over multiply/divide
    // (x*y)^n gives x^n * y^n
    // (x/y)^n gives x^n / y^n
    pow: {
        multiply: {
            changeType: ChangeTypes.KEMU_POWER_FACTORS,
        },
        _isBinaryOnly: true
    },
    // Distribute multiply over add/subtract
    // a * (x + y) gives ax + ay
    // a * (x - y) gives ax - ay
    multiply: {
        add: { changeType: ChangeTypes.KEMU_DISTRIBUTE_MUL_OVER_ADD },
    },
    // Distribute divide over add/subtract
    // (x + y) / a gives x/a + y/a
    // (x - y) / a gives x/a - y/a
    divide: {
        add: { changeType: ChangeTypes.BREAK_UP_FRACTION },
        _isBinaryOnly: true
    },
    // Distribute unary minus over add/subtract
    // - (a + b + c + ...) gives -a + (-b) + (-c) + ...
    unaryMinus: {
        add: {
            changeType: ChangeTypes.DISTRIBUTE_NEGATIVE_ONE,
            isUnary: true
        },
    }
};
export default (node) => {
    let rv = null;
    const masterDistObj = DISTRIBUTE_MAP[node.fn];
    if (masterDistObj) {
        let commonNodeIdx = 0;
        let groupNodeIdx = -1;
        let distObj = null;
        // Search for argument, which we can distribute over.
        // Example: a * ... * (x + y + z) * ...
        //         ^^^         ^^^^^^^^^
        //      common node    group node
        const idxEnd = masterDistObj._isBinaryOnly ? 1 : node.args.length;
        for (let idx = 0; idx < idxEnd; idx++) {
            distObj = masterDistObj[node.args[idx].fn];
            if (distObj) {
                groupNodeIdx = idx;
                break;
            }
        }
        // Process node if distribute pattern found.
        if (distObj) {
            let newNode = null;
            const groupNode = node.args[groupNodeIdx];
            const commonOpGroupArgs = [];
            if (distObj.isUnary) {
                // Distribute unary function.
                // Example: f(a + b + c + ...) gives f(a) + f(b) + f(c) + ...
                // Distribute unary function over group of nodes.
                groupNode.args.forEach((nextNode) => {
                    commonOpGroupArgs.push(Node.Creator.kemuCreateByFn(node.fn, nextNode));
                });
            }
            else {
                // Default scenario.
                // Distribute binary operator.
                // Example: a * (x + y + ...) gives ax + ay + ...
                if (groupNodeIdx === commonNodeIdx) {
                    if (commonNodeIdx === 0) {
                        commonNodeIdx++;
                    }
                    else {
                        commonNodeIdx--;
                    }
                }
                const commonNode = node.args[commonNodeIdx];
                // Distribute common operation of group of nodes.
                groupNode.args.forEach((nextNode) => {
                    // Keep arguments order.
                    // a (x + y + z)  gives ax + ay + az
                    // (x + y + z) a  gives xa + ya + za
                    const newArgs = (commonNodeIdx < groupNodeIdx)
                        ? [commonNode, nextNode]
                        : [nextNode, commonNode];
                    // Add new term.
                    commonOpGroupArgs.push(Node.Creator.operator(node.op, newArgs));
                });
            }
            // Create final node to replace current one.
            const commonOpGroupNode = Node.Creator.operator(groupNode.op, commonOpGroupArgs);
            if (node.args.length <= 2) {
                // No arguments remaining.
                // Just replace final node with distributed one.
                // Example: a * (x+y+z) gives ax + ay + az
                newNode = commonOpGroupNode;
            }
            else {
                // There are still remaining nodes.
                // Replace two original nodes by distributed one:
                // a * ... (x + y + z) * ... gives ... * (ax + ay * az) * ...
                // ^^       ^^^^^^^^^
                // remove   insert new
                //          node here
                newNode = clone(node);
                newNode.args[groupNodeIdx] = commonOpGroupNode;
                newNode.args.splice(commonNodeIdx, 1);
            }
            // Build result object.
            rv = {
                changeType: distObj.changeType,
                rootNode: newNode
            };
        }
    }
    return rv;
};
