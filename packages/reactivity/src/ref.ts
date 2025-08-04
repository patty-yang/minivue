import { activeSub } from './effect'
import { Link, link, propagate, Dependency } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'

// ==================== 类型定义 ====================

export enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

export interface Ref<T = any> extends Dependency {
  value: T
  [ReactiveFlags.IS_REF]: true
}

// ==================== 核心类 ====================

/**
 * Ref 的类
 */
class RefImpl<T> implements Ref<T>, Dependency {
  _value: T // 保存实际的值
  [ReactiveFlags.IS_REF] = true as const // ref 标记，是否是一个 ref
  subs: Link // 订阅者链表的头节点
  subsTail: Link // 订阅者链表的尾节点
  constructor(value: T) {
    this._value = (isObject(value) ? reactive(value as object) : value) as T
  }

  get value(): T {
    // 收集依赖
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue: T) {
    if (hasChanged(newValue, this._value)) {
      // 派发更新
      this._value = (isObject(newValue) ? reactive(newValue as object) : newValue) as T
      triggerRef(this)
    }
  }
}

// ==================== 导出函数 ====================

export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value)
}

export function isRef(value: any): value is Ref {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关联关系
 * @param dep 依赖项
 */
export function trackRef(dep: Ref): void {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep 依赖项
 */
export function triggerRef(dep: Ref): void {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
