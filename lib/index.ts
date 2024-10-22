import type { AChangeType, AChangeTypeCore, AChangeTypeGroup, AChangeTypeOnly, AChangeTypeWithCase, AEquationChangeType, AMistakeTypeOnly, EQUATION_CHANGE_TYPES, EquationChangeTypes } from './types/changeType/ChangeTypes'
import math from '~/config'
import { convertTextToTeX, isOkAsSymbolicExpression, parseText, print, printAsTeX, registerPreprocessorAfterParse, registerPreprocessorBeforeParse } from '~/newServices/nodeServices/parseText'
import type { ProcessedEquation } from '~/simplifyExpression/equationEvaluation'
import { assessUserEquationStep, assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import { simplifyExpression, solveEquation } from './indexPrepareSimplifyAndSolve'
import { assessUserStep, assessUserSteps } from './simplifyExpression/stepEvaluationCore'
import { changeTypeIsInGroup, convertAdditionToSubtractionErrorType, convertMistakeOnlyTypeToItsChangeType, doesChangeTypeEqual, getChangeTypeGroups, getEveryChangeIdApplicable, getRootChangeType, isChangeTypeInGroup, isMistakeTypeOnly, isSameRootChangeType } from './types/changeType/changeAndMistakeUtils.js'
import { ChangeTypes } from './types/changeType/ChangeTypes'

export type{
  AChangeType,
  AChangeTypeCore,
  AChangeTypeGroup,
  AChangeTypeOnly,
  AChangeTypeWithCase,
  AEquationChangeType,
  AMistakeTypeOnly,
  ProcessedEquation,
  StepInfo,
}
export {
  assessUserEquationStep,
  assessUserEquationSteps,
  assessUserStep,
  assessUserSteps,
  changeTypeIsInGroup,
  ChangeTypes,
  // compareByText,
  convertAdditionToSubtractionErrorType,
  convertMistakeOnlyTypeToItsChangeType,
  convertTextToTeX,
  doesChangeTypeEqual,
  EQUATION_CHANGE_TYPES,
  EquationChangeTypes,
  getChangeTypeGroups,
  getEveryChangeIdApplicable,
  // Change type utils
  getRootChangeType,
  isChangeTypeInGroup,
  isMistakeTypeOnly,
  //
  isOkAsSymbolicExpression,
  isSameRootChangeType,
  // kemuSolveEquation,
  math,
  // normalizeExpression,
  parseText,
  print,
  printAsTeX,
  registerPreprocessorAfterParse,
  registerPreprocessorBeforeParse,
  simplifyExpression,
  solveEquation,
}

export default {
  simplifyExpression,
  solveEquation,
  // kemuSolveEquation,
  ChangeTypes,
  // normalizeExpression,
  print,
  printAsTeX,
  // compareByText,
  math,
  FunctionNode: math.FunctionNode,
  convertTextToTeX,
  parseText,
  isOkAsSymbolicExpression,
  registerPreprocessorBeforeParse,
  registerPreprocessorAfterParse,
}
