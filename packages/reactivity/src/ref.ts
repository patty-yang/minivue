import { activeSub } from './effect'

enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

/**
 * Ref 的类
 */
class RefImpl {
  _value // 保存实际的值
  subs; // 保存和 effect 的关联关系
  [ReactiveFlags.IS_REF] = true // ref 标记，是否是一个 ref
  constructor(value) {
    this._value = value
  }

  get value() {
    // 收集依赖
    if (activeSub) {
      // 保存当前的收集函数，等更新的时候触发
      this.subs = activeSub
    }
    return this._value
  }

  set value(newValue) {
    // 派发更新
    this._value = newValue
    // 重新执行，获取到最新的值
    this.subs?.()
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}
