import { evaluateUserSteps } from '~/simplifyExpression/stepEvaluationCore.js'
import { logger } from '~/util/logger'
import { veryCleanEquation } from '~/util/stringUtils.js'

export function main() {
  logger.info('-----START------')
  const userSteps = [
    '5x * 3x + 4 + 3 + -2',
    '5x * 3x + 4 + 2',
    '5x * 3x + 9',
  ]
  // printTree(simplifyCommon.kemuFlatten(parseText(userSteps[0])))

  const startTime = performance.now()
  const evaluatedSteps = evaluateUserSteps(userSteps)

  logger.debug(`Complete: Total time taken : ${performance.now() - startTime} milliseconds`)
  logger.debug('-----ATTEMPTS------')
  logger.flushDeferredLogs()
  logger.debug('-----ATTEMPTS END------')
  // deferred logs will be printed here. (they can interfere with performance time)
  evaluatedSteps.forEach((steps, index) => {
    const stepIndex = index + 1
    const stepMessage = `Step ${stepIndex}: `
    const skipMessage = `skipped: ${steps.length - 1} steps `

    steps.forEach((step) => {
      const fromEquation = veryCleanEquation(step.from || '')
      const toEquation = veryCleanEquation(step.to || '')
      const validToEquation = veryCleanEquation(step.validTo || '')
      const startingEquation = veryCleanEquation(userSteps?.[0] || '')

      if (step.mistakenChangeType === 'NO_CHANGE')
        logger.regularLog(`${stepMessage}No change from: ${fromEquation} to: ${toEquation}`)
      else if (!step.isValid)
        logger.regularLog(`${stepMessage}[Invalid, Incorrect]\n${skipMessage}\nfrom: ${fromEquation}\nto: ${toEquation}.\nExpected: ${step?.validChangeType || `one of: [${step?.possibleChangeTypes?.join(', ')}]`}: ${validToEquation},\nError Type Found: ${step.mistakenChangeType}.`)
      else if (step.isValid && step.isCorrect)
        logger.regularLog(`${stepMessage}[Valid, Correct]\n${skipMessage}\nfrom: ${fromEquation}\nto: ${validToEquation}.\nType: ${step.validChangeType}.`)
      else // (step.isValid && !step.isCorrect)
        logger.regularLog(`${stepMessage}[Valid, Incorrect]\n${skipMessage}\nfrom: ${fromEquation}\nto: ${validToEquation}.\nType: ${step.validChangeType}\nOverall incorrect coming from ${startingEquation}.`)
    })
  })
}
