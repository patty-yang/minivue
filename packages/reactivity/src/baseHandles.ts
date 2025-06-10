import { track, trigger } from './dep'
import { isRef } from './ref'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    /**
     *  将 target 中的 key 和 sub 绑定关系
     */
    track(target, key)
    /**
     * receiver 保证访问器里的 this 指向代理对象
     */
    const res = Reflect.get(target, key, receiver)
    /**
     * target = { a: ref(0) }
     * target.a 不需要 .value
     */
    if (isRef(res)) return res.value

    if (isObject(res)) {
      // 如果 res 是个普通对象 给包装成响应式对象
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {
    const oldValue = Reflect.get(target, key)
    const res = Reflect.set(target, key, value, receiver)

    if (isRef(oldValue) && !isRef(value)) {
      /**
       * const a = ref(0)
       * target = { a  }
       * target.a = 1
       * a.value = 1
       */
      oldValue.value = value
      return res
    }
    if (hasChanged(oldValue, value)) {
      trigger(target, key)
    }
    return res
  }
}
