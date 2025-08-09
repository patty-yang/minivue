import { activeSub } from './effect'
import { Dependency, link, Link, propagate } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'

// ==================== 类型定义 ====================

export enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

export interface Ref<T = any> {
  value: T
  readonly [ReactiveFlags.IS_REF]: boolean
}

// ==================== 核心类 ====================

/**
 * Ref 的类
 */
class RefImpl<T> implements Ref<T>, Dependency {
  _value: T; // 保存实际的值
  [ReactiveFlags.IS_REF] = true as const // ref 标记，是否是一个 ref
  subs: Link | undefined = undefined // 订阅者链表的头节点
  subsTail: Link | undefined = undefined // 订阅者链表的尾节点

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
      this._value = (
        isObject(newValue) ? reactive(newValue as object) : newValue
      ) as T
      triggerRef(this)
    }
  }
}

class ObjectRefImpl<T extends object, K extends keyof T> implements Ref<T[K]> {
  [ReactiveFlags.IS_REF] = true as const

  constructor(
    public _object: T,
    public _key: K
  ) {}

  get value(): T[K] {
    return this._object[this._key]
  }

  set value(newVal: T[K]) {
    if (hasChanged(newVal, this._object[this._key])) {
      this._object[this._key] = newVal
    }
  }
}

// ==================== 导出函数 ====================

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关联关系
 * @param dep 依赖项
 */
export function trackRef(dep: Dependency): void {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep 依赖项
 */
export function triggerRef(dep: Dependency): void {
  if (dep.subs) {
    propagate(dep.subs)
  }
}

export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value)
}

export function isRef<T = any>(value: any): value is Ref<T> {
  return !!(value && value[ReactiveFlags.IS_REF])
}

export function toRef<T extends object, K extends keyof T>(
  target: T,
  key: K
): Ref<T[K]> {
  return new ObjectRefImpl(target, key)
}

/**
 * target 必须是一个响应式对象
 * @param target
 */
export function toRefs<T extends object>(
  target: T
): { [K in keyof T]: Ref<T[K]> } {
  const res = {} as { [K in keyof T]: Ref<T[K]> }
  for (const targetKey in target) {
    // keyof T 遍历出来的是 string，因此需要断言为 K
    res[targetKey as keyof T] = new ObjectRefImpl(
      target,
      targetKey as keyof T
    ) as { [K in keyof T]: Ref<T[K]> }[keyof T]
  }
  return res
}

export function unref<T>(value: T | Ref<T>): T {
  return isRef(value) ? (value as Ref<T>).value : (value as T)
}

type ProxyRefs<T extends object> = {
  [K in keyof T]: T[K] extends Ref<infer V> ? V : T[K]
}

export function proxyToRefs<T extends object>(target: T): ProxyRefs<T> {
  return new Proxy(target as any, {
    get(...args) {
      /**
       * 自动解包
       * 如果这个 target[key] 是一个 ref 返回 ref.value 否则返回 target[key]
       */
      const res = Reflect.get(...args)
      return unref(res)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]

      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }
      return Reflect.set(target as any, key, newValue, receiver)
    }
  }) as ProxyRefs<T>
}
