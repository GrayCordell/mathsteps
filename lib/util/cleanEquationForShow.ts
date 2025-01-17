import { myNodeToString } from '~/newServices/nodeServices/myNodeToString.js'
import { parseText } from '~/newServices/nodeServices/parseText'
import { veryCleanEquation } from './veryCleanString'


export const cleanEquationForShow = (str: string) => {
  const core = (str: string) => veryCleanEquation(myNodeToString(parseText((str))))
  if (str.includes('=')) {
    const [left, right] = str.split('=')
    return `${core(left)} = ${core(right)}`
  }
  else {
    return core(str)
  }
}
