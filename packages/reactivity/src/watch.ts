import { ReactiveEffect } from './effect'
import { isRef, Ref } from './ref'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

// ==================== 类型定义 ====================

export interface WatchOptions {
  immediate?: boolean
  once?: boolean
  deep?: boolean | number
}

export type WatchSource<T = any> = Ref<T> | object | (() => T)
export type WatchCallback<T = any> = (
  newValue: T,
  oldValue: T | undefined,
  onCleanup: (cleanupFn: () => void) => void
) => void

export type CleanupFunction = () => void

// ==================== 工具函数 ====================

function traverse(
  value: any,
  depth: number = Infinity,
  seen: Set<any> = new Set()
): any {
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

    cb = (...args: Parameters<WatchCallback<T>>) => {
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
    getter = () => source as T
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    /**
     * 如果 source 是一个函数的话
     */
    getter = source as () => T
  } else {
    // 处理其他情况，确保 getter 有默认值
    getter = () => source as T
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let oldValue: T | undefined

  let cleanup: CleanupFunction | null = null

  function onCleanup(cleanupFn: CleanupFunction): void {
    cleanup = cleanupFn
  }

  function job(): void {
    if (cleanup) {
      // 如果有 cleanup 就执行 cleanup，执行完重置为空
      cleanup()
      cleanup = null
    }
    // 执行 effect 的 run 拿到getter 的返回值，不能直接执行 getter 因为要收集依赖
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
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
