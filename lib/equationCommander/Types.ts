import type { ProcessedStep } from '~/simplifyExpression/stepEvaluationCore'

export interface EqProcessedSteps { left: ProcessedStep[], right: ProcessedStep[] }

export interface EqLRStep { left: ProcessedStep, right: ProcessedStep }
export interface EqLRStepWithNewTo extends EqLRStep { newTo: string }
