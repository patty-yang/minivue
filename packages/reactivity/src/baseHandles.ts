import { track, trigger } from './dep'
import { isRef } from './ref'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'

// ==================== 导出对象 ====================

export const mutableHandlers: ProxyHandler<object> = {
  get(target: object, key: string | symbol, receiver: object): any {
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
  set(
    target: object,
    key: string | symbol,
    value: any,
    receiver: object
  ): boolean {
    const oldValue = Reflect.get(target, key)

    //region Description: 为了处理隐式更新数组的 length
    const targetIsArray = Array.isArray(target)
    const oldLength = targetIsArray ? target.length : 0
    //endregion
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

    const newLength = targetIsArray ? target.length : 0
    if (targetIsArray && key !== 'length' && newLength !== oldLength) {
      /**
       * 但是隐式更新 length
       * 更新前 length = 3 => ['a', 'b', 'c',]
       * 更新后 length = 4 => ['a','b','c', 'd']
       * 隐式更新的方式: 通过 push、pop、shift、unshift 等方法
       */
      trigger(target, 'length')
    }
    return res
  }
}
