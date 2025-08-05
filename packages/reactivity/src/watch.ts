import { ReactiveEffect } from './effect'
import { isRef, Ref } from './ref'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

// ==================== 类型定义 ====================

export interface WatchOptions {
  immediate?: boolean
  once?: boolean
  deep?: boolean
}

export type WatchSource<T = any> = Ref<T> | (() => T)
export type WatchCallback<T = any> = (newValue: T, oldValue: T) => void

// ==================== 工具函数 ====================

function traverse(value: any, depth = Infinity, seen = new Set()): any {
  // 如果不是一个对象或者监听的层级到了 直接返回
  if (!isObject(value) || depth <= 0) return value

  // 如果之前访问过直接返回 避免循环引入 导致溢出
  if (seen.has(value)) return value

  depth--
  seen.add(value)

  for (const key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}

// ==================== 导出函数 ====================

export function watch<T = any>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options?: WatchOptions
): () => void {
  let { immediate, once, deep } = options || {}
  if (once) {
    // 如果传递了 once 就保存一份 cb 执行完原回掉之后，停止监听
    const _cb = cb

    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }
  let getter: () => T
  if (isRef(source)) {
    getter = () => (source as Ref<T>).value
  } else if (isReactive(source)) {
    /**
     * 如果值是 reactive 那么默认 deep = true
     * 如果传了 就使用传递的
     */
    getter = () => source as any
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    /**
     * 如果 source 是一个函数的话
     */
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }
  let oldValue: T

  function job(): void {
    // 执行 effect 的 run 拿到getter 的返回值，不能直接执行 getter 因为要收集依赖
    const newValue = effect.run()

    cb(newValue, oldValue)
    // 下一次的 oldValue 是当前的 newValue
    oldValue = newValue
  }

  function stop(): void {
    return effect.stop()
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    // 拿到 oldValue，并且收集依赖
    oldValue = effect.run()
  }

  return stop
}
