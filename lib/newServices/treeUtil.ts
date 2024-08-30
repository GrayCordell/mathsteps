import type { MathNode } from 'mathjs'
import { isConstantNode, isFunctionNode, isOperatorNode, isSymbolNode } from '~/config'
import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { kemuFlatten } from '~/simplifyExpression/kemuSimplifyCommonServices'

export function printTree(node: MathNode | null, prefix: string = '', isLeft: boolean = true, isStart: boolean = true): void {
  if (!node)
    return

  if (isStart) {
    console.log('_______________________________')
    console.log('Root Node: ', myNodeToString(node))
  }

  let currentNodeRepresentation = ''

  if (isFunctionNode(node))
    currentNodeRepresentation = node.fn.name
  else if (isOperatorNode(node))
    currentNodeRepresentation = node.fn
  else if (isSymbolNode(node))
    currentNodeRepresentation = node.name
  else if (isConstantNode(node))
    currentNodeRepresentation = String(node.value)

  console.log(prefix + (isLeft ? '├── ' : '└── ') + currentNodeRepresentation)

  if (isOperatorNode(node)) {
    for (let i = 0; i < node.args.length - 1; i++) {
      printTree(node.args[i], prefix + (isLeft ? '│   ' : '    '), true, false)
    }

    if (node.args.length > 0) {
      printTree(node.args[node.args.length - 1], prefix + (isLeft ? '│   ' : '    '), false, false)
    }
  }
}

export function travelTree(node: MathNode, fn: (node: MathNode) => void, context: { visited?: Set<MathNode> } = {}): void {
  context.visited = context.visited || new Set()
  if (isOperatorNode(node)) {
    node.args.forEach((arg) => {
      travelTree(arg, fn)
    })
  }
  fn(node)
}

// Uses current context state to change the entire tree with the node change.
export function setUpNewNodeTree(context: any, newNode: MathNode, newTopNode: MathNode | null = null): void {
  if (!newTopNode)
    newTopNode = newNode

  if (context.parent) {
    context.parent.args[context.index] = newNode
  }
  else if (newNode.type === context.topNode.type) {
    Object.keys(context.topNode).forEach(key => delete context.topNode[key])
    Object.assign(context.topNode, newTopNode)
  }
  else {
    context.topNode = newNode
  }
}

export function travelTreeExpanded(node: MathNode, fn: (node: MathNode, context: any) => void, context: any = {}): void {
  if (!context.visited) {
    context.visited = new Set()
    node = kemuFlatten(node)
    context.topNode = node
    context.depth = 0
  }

  const stack: any = [{ node, parent: null, parentParent: null, parentIndex: null, index: null, depth: 0 }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current)
      continue

    const { node, parent, parentParent, parentIndex, index, depth } = current

    if (context.visited.has(node))
      continue

    context.visited.add(node)
    fn(node, { ...context, parent, parentParent, parentIndex, index, depth })

    if (parent && parent.args)
      parent.args[index!] = node
    if (parentParent && parentParent.args)
      parentParent.args[parentIndex!] = parent

    if (node.args) {
      const currentParentIndex = index !== null ? index : 0
      for (let i = node.args.length - 1; i >= 0; i--) {
        stack.push({
          node: node.args[i],
          parent: node,
          parentParent: parent,
          parentIndex: currentParentIndex,
          index: i,
          depth: depth + 1,
        })
      }
    }
  }
}

export function removeImplicitMultiplicationFromNode(node: MathNode): MathNode {
  node.traverse((node) => {
    const node_ = node as MathNode & { implicit?: boolean }
    if (node_.implicit)
      node_.implicit = false
  })
  return node
}

/*  Maybe use later
function markTree(node: MathNode): void {
  let id = 0;
  travelTreeExpanded(node, (node) => {
    node.markedId = id;
    id++;
  });
}

function unMarkTree(node: MathNode): void {
  travelTreeExpanded(node, (node) => {
    delete node.markedId;
  });
}

function retrieveChangedBasedOnIdNotBeingInSamePlace(node: MathNode): MathNode | null {
  let foundNode: MathNode | null = null;
  let id = 0;
  travelTreeExpanded(node, (node) => {
    if (node.markedId !== id) foundNode = node;
    id++;
  });
  return foundNode;
}

function findByIdInTree(node: MathNode, id: number): MathNode | null {
  let foundNode: MathNode | null = null;
  travelTreeExpanded(node, (node) => {
    if (node.markedId === id) foundNode = node;
  });
  return foundNode;
}
*/
