import { activeSub } from './effect'
import { Link, link, propagate } from './system'

enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

/**
 * Ref 的类
 */
class RefImpl {
  _value; // 保存实际的值
  [ReactiveFlags.IS_REF] = true // ref 标记，是否是一个 ref
  subs: Link // 订阅者链表的头节点
  subTail: Link // 订阅者链表的尾节点
  constructor(value) {
    this._value = value
  }

  get value() {
    // 收集依赖
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    // 派发更新
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关联关系
 * @param dep
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep
 */
export function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
