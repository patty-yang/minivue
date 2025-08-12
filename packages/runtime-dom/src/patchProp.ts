import { patchClass } from './modules/patchClass'
import { patchStyle } from './modules/patchStyle'
import { isOn } from '@vue/shared'
import { patchEvent } from './modules/events'

/**
 * 1. class
 * 2. style
 * 3. event
 * 4. attrs
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 */
export function patchProp(el, key, prevValue, nextValue) {
  // console.log('el,key,prevValue,nextValue ==> ', el, key, prevValue, nextValue)
  if (key === 'class') {
    patchClass(el, nextValue)
  }

  if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  }

  // @click => onClick
  if (isOn(key)) {
    patchEvent(el, key, nextValue)
  }
}
