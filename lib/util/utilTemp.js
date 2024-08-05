import { resolve } from 'mathjs';
import { createUtil } from 'mathjs/util';
import {math} from '~/config.js';
import  {hasOwnProperty} from 'mathjs/utilObject';
import  {isConstantNode} from 'mathjs/utilIs';


const OperatorNode = math.OperatorNode;
const FunctionNode = math.FunctionNode;
const SymbolNode = math.SymbolNode;

const { isCommutative, isAssociative, allChildren, createMakeNodeFunction, flatten,   unflattenr, unflattenl } =
    createUtil({ FunctionNode, OperatorNode, SymbolNode })



export {isConstantNode, resolve, isCommutative, isAssociative, allChildren, createMakeNodeFunction, flatten, unflattenr, unflattenl, hasOwnProperty }
