import type { AChangeType, AChangeTypeCore, AChangeTypeGroup, AChangeTypeOnly, AChangeTypeWithCase, AEquationChangeType, AMistakeTypeOnly, EQUATION_CHANGE_TYPES, EquationChangeTypes } from './types/changeType/ChangeTypes'
import type { AMathRule, getChangesTypesForRule, getMathRuleForChangeType } from './types/changeType/MathRuleTypes'
import math from '~/config'
import { convertTextToTeX, isOkAsSymbolicExpression, parseText, print, printAsTeX, registerPreprocessorAfterParse, registerPreprocessorBeforeParse } from '~/newServices/nodeServices/parseText'
import type { ProcessedEquation } from '~/simplifyExpression/equationEvaluation'
import { assessUserEquationStep, assessUserEquationSteps } from '~/simplifyExpression/equationEvaluation'
import type { StepInfo } from '~/simplifyExpression/stepEvaluationCore'
import EquationCommander from './equationCommander'
import { simplifyExpression, solveEquation } from './indexPrepareSimplifyAndSolve'
import { myNodeToString } from './newServices/nodeServices/myNodeToString'
import { assessUserStep, assessUserSteps } from './simplifyExpression/stepEvaluationCore'
import { changeTypeIsInGroup, convertAdditionToSubtractionErrorType, convertMistakeOnlyTypeToItsChangeType, doesChangeTypeEqual, getChangeTypeGroups, getEveryChangeIdApplicable, getRootChangeType, isChangeTypeInGroup, isMistakeTypeOnly, isSameRootChangeType } from './types/changeType/changeAndMistakeUtils.js'
import { ChangeTypes } from './types/changeType/ChangeTypes'
import { MATH_RULE_TO_CHANGE_TYPE_MAPPING } from './types/changeType/MathRuleTypes'
import { printAscii } from './util/print'
import { cleanEquationForShow } from './util/stringUtils'

export type{
  AChangeType,
  AChangeTypeCore,
  AChangeTypeGroup,
  AChangeTypeOnly,
  AChangeTypeWithCase,
  AEquationChangeType,
  AMathRule,
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
  cleanEquationForShow,
  // compareByText,
  convertAdditionToSubtractionErrorType,
  convertMistakeOnlyTypeToItsChangeType,
  convertTextToTeX,
  doesChangeTypeEqual,
  EQUATION_CHANGE_TYPES,
  EquationChangeTypes,
  EquationCommander,
  getChangesTypesForRule,
  getChangeTypeGroups,
  getEveryChangeIdApplicable,
  getMathRuleForChangeType,
  // Change type utils
  getRootChangeType,
  isChangeTypeInGroup,
  isMistakeTypeOnly,
  //
  isOkAsSymbolicExpression,
  isSameRootChangeType,
  // kemuSolveEquation,
  math,
  MATH_RULE_TO_CHANGE_TYPE_MAPPING,
  myNodeToString,
  // normalizeExpression,
  parseText,
  print,
  printAscii,
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
