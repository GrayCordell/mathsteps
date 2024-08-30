import { FunctionNode, OperatorNode, SymbolNode } from '~/config'
import { createUtil, hasOwnProperty } from '~/utilRipFromMathJS/msc.js'

const { isCommutative, isAssociative, allChildren, createMakeNodeFunction, flatten, unflattenr, unflattenl }
    = createUtil({ FunctionNode, OperatorNode, SymbolNode })

export { isCommutative, isAssociative, allChildren, createMakeNodeFunction, flatten, unflattenr, unflattenl, hasOwnProperty }
