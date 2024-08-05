// function to print the tree structure in the console
function printTree(node, prefix = '', isLeft = true, isStart = true) {
    let newNode = node
    if (!newNode)
        return
    if(isStart){
        console.log('_______________________________')
        console.log('Root Node: ', newNode.toString())
    }

    const operatorNodes = ['OperatorNode', 'FunctionNode']
    const isOperator = operatorNodes.includes(newNode.type)

    let currentNodeRepresentation = ''
    if (isOperator) {
        currentNodeRepresentation = newNode.op || newNode.fn
    } else if (newNode.type === 'SymbolNode') {
        currentNodeRepresentation = newNode.name
    } else if (newNode.type === 'ConstantNode') {
        currentNodeRepresentation = newNode.value
    }

    console.log(prefix + (isLeft ? '├── ' : '└── ') + currentNodeRepresentation)

    if (newNode.args) {
        for (let i = 0; i < newNode.args.length - 1; i++) {
            printTree(newNode.args[i],prefix + (isLeft ? '│   ' : '    '), true, false)
        }
        if (newNode.args.length > 0) {
            printTree(newNode.args[newNode.args.length - 1], prefix + (isLeft ? '│   ' : '    '), false,false)
        }
    }
}

function travelTree(node, fn,context = {}){
    context = context || {}
    context.visited = context.visited || new Set()

    if (node.args) {
        node.args.forEach((arg) => {
            travelTree(arg, fn)
        })
    }
    fn(node)
}


function markTree(node) {
  let id = 0
  travelTreeExpanded(node, (node, context) => {
    node.markedId = id
    id++
  })
}
function unMarkTree(node) {
  travelTreeExpanded(node, (node, context) => {
    delete node.markedId
  })
}
function retrieveChangedBasedOnIdNotBeingInSamePlace(node) {
  let foundNode = null
  let id = 0
  travelTreeExpanded(node, (node, context) => {
    if (node.markedId !== id) {
      foundNode = node
    }
    id++
  })
  return foundNode
}
function findByIdInTree(node, id) {
  let foundNode = null
  travelTreeExpanded(node, (node, context) => {
    if (node.markedId === id) {
      foundNode = node
    }
  })
  return foundNode
}
// Uses current context state to change the entire tree with the node change.
function setUpNewNodeTree(context, newNode,newTopNode = null){
    if(!newTopNode)
        newTopNode = newNode

    // Directly modify the object properties to ensure changes reflect in topNode
    if (context.parent) {
        context.parent.args[context.index] = newNode
    } else {
        // If no parent, replace the properties of the top node itself
        Object.keys(context.topNode).forEach(key => delete context.topNode[key])
        Object.assign(context.topNode, newTopNode)
    }
}

let simplifyCommon
function travelTreeExpanded(node, fn, context = {}) {
    simplifyCommon = simplifyCommon || require('../simplifyExpression/_common'); // dumb

    if (!context.visited) {
        context.visited = new Set();
        node = simplifyCommon.kemuFlatten(node);
        context.topNode = node;
        context.depth = 0;
    }

    const stack = [{ node, parent: null, parentParent: null, parentIndex: null, index: null, depth: 0 }];

    while (stack.length > 0) {
        const current = stack.pop();
        const { node, parent, parentParent, parentIndex, index, depth } = current;

        if (context.visited.has(node)) {
            continue;
        }

        context.visited.add(node);
        fn(node, { ...context, parent, parentParent, parentIndex, index, depth });

        if (parent && parent.args) {
            parent.args[index] = node;
        }

        if (parentParent && parentParent.args) {
            parentParent.args[parentIndex] = parent;
        }

        if (node.args) {
            const currentParentIndex = index !== null ? index : 0;
            for (let i = node.args.length - 1; i >= 0; i--) {
                stack.push({
                    node: node.args[i],
                    parent: node,
                    parentParent: parent,
                    parentIndex: currentParentIndex,
                    index: i,
                    depth: depth + 1
                });
            }
        }
    }
}

function removeImplicitMultiplicationFromNode(node) {
    travelTreeExpanded(node,(_node)=>{
        if(_node.implicit)
            _node.implicit = false
    })
    return node
}

module.exports = {
    printTree: printTree,
    travelTree: travelTree,
    travelTreeExpanded: travelTreeExpanded,
    setUpNewNodeTree: setUpNewNodeTree,
    removeImplicitMultiplicationFromNode,
    //markTree: markTree,
    //unMarkTree: unMarkTree,
    //retrieveChangedBasedOnIdNotBeingInSamePlace: retrieveChangedBasedOnIdNotBeingInSamePlace,
    //findByIdInTree: findByIdInTree
}
