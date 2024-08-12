import { evaluateUserSteps } from '~/simplifyExpression/stepEvaluationCore.js'
import { logger } from '~/util/logger'
import { cleanString } from '~/util/myNodeToString.js'

export function main() {
  logger.info('-----START------')
  const userSteps = [
    // '1 + 1',
    // '0',
    '5x * 3x * 2x * 7x * 8x * 4x',
    '5x * 3x * 14x^2 * 8x * 4x',
    // '4 + ( 1 + (4/2) )',
    // '4 + 3',
    // '4 + 2',
    // '5x * 3x + 2*(3 + 4 * 3 * (2+3))',
    // '5x * 3x + 2*(3 + 4 * 3 * 2)',
  ]
  // printTree(simplifyCommon.kemuFlatten(parseText(userSteps[0])))

  const startTime = performance.now()
  const evaluatedSteps = evaluateUserSteps(userSteps)

  logger.debug(`Complete: Total time taken : ${performance.now() - startTime} milliseconds`)
  logger.debug('-----ATTEMPTS------')
  logger.flushDeferredLogs()
  // deferred logs will be printed here. (they can interfere with performance time)
  logger.debug('-----Assessment------')

  // print all
  evaluatedSteps.forEach((steps, i) => {
    logger.debug(`step ${i + 1}, had "skipped": ${steps.length - 1} steps`)
    for (const step of steps) {
      if (step.hasFoundMToStep)
        logger.debug(`invalid_change from: ${cleanString(step.from)} to: ${cleanString(step.mTo)}. should have been: ${step.changeType}: ${cleanString(step.to)}, but found ${step.mistakenChangeType}`)
      else if (step.isValid === false)
        logger.debug(`invalid_change from: ${cleanString(step.from)} to: ${cleanString(step.to)}`)
      else
        logger.debug(`valid_change:${step.changeType} from: ${cleanString(step.from)} to: ${cleanString(step.to)}`)
    }
  })
}
