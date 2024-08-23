import { logger } from '~/util/logger'
import { veryCleanEquation } from '~/util/stringUtils.js'
import { demoUserSteps } from '~/mainExperimentEquationDemo.js'
import { assessUserSteps } from '~/simplifyExpression/stepEvaluationCore'

export function main() {
  logger.info('-----START------')

  const userSteps = demoUserSteps
  // printTree(simplifyCommon.kemuFlatten(parseText(userSteps[0])))

  const startTime = performance.now()
  const evaluatedSteps = assessUserSteps(userSteps)

  logger.debug(`Complete: Total time taken : ${performance.now() - startTime} milliseconds`)
  logger.debug('-----ATTEMPTS------')
  logger.flushDeferredLogs()
  logger.debug('-----ATTEMPTS END------')
  // deferred logs will be printed here. (they can interfere with performance time)
  evaluatedSteps.forEach((steps, index) => {
    const stepIndex = index + 1
    const stepMessage = `Step ${stepIndex}: `
    const skipMessage = `Skipped: ${steps.length - 1} steps `

    logger.regularLog(`${stepMessage}${skipMessage}\n`)

    steps.forEach((step) => {
      const fromEquation = veryCleanEquation(step.from || '')
      const toEquation = veryCleanEquation(step.to || '')
      const attemptedToGetTo = veryCleanEquation(step.attemptedToGetTo || '')
      const startingEquation = veryCleanEquation(userSteps?.[0] || '')

      if (step.mistakenChangeType === 'NO_CHANGE')
        logger.regularLog(`No change from: ${fromEquation} to: ${toEquation}`)
      else if (!step.isValid && step.mistakenChangeType === 'UNKNOWN')
        logger.regularLog(`[Invalid]\nfrom: ${fromEquation}\nto: ${toEquation}\nExpected one of these:[${step?.availableChangeTypes?.join(', ')}]: \nError Type Found: ${step.mistakenChangeType}`)
      else if (!step.isValid && step?.attemptedToGetTo === 'UNKNOWN')
        logger.regularLog(`[Invalid]\nfrom: ${fromEquation}\nto: ${toEquation}\nThey Tried: ${step?.attemptedChangeType},\nError Type Found: ${step.mistakenChangeType}`)
      else if (!step.isValid)
        logger.regularLog(`[Invalid]\nfrom: ${fromEquation}\nto: ${toEquation}\nThey Tried: ${step?.attemptedChangeType}:\nThey should have had ${attemptedToGetTo},\nError Type Found: ${step.mistakenChangeType}`)
      else if (step.isValid && step.reachesOriginalAnswer)
        logger.regularLog(`[Valid & Reaches OG Answer]\nfrom: ${fromEquation}\nto: ${toEquation}\nType: ${step.attemptedChangeType}`)
      else // (step.isValid && !step.reachesOriginalAnswer)
        logger.regularLog(`[Valid & Does NOT Reach OG Answer]\nfrom: ${fromEquation}\nto: ${toEquation}\nType: ${step.attemptedChangeType}\nNote: Is overall incorrect coming from ${startingEquation}`)
    })
  })
}
