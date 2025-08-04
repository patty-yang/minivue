import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandles'

// ==================== 全局变量 ====================

const reactiveMap = new WeakMap<object, object>() // 保存 target 和 响应式对象之间的关联关系

const reactiveSet = new WeakSet<object>() // 保存所有使用 reactive 创建出来的响应式对象

// ==================== 工具函数 ====================

function createReactiveObject<T extends object>(target: T): T {
  /**
   * reactive 必须是一个对象
   */
  if (!isObject(target)) return target

  /**
   *
   *   获取之前代理过的对象 解决⬇️
   *   const obj = { a: 0 }
   *   const state = reactive(obj)
   *   const state2 = reactive(obj)
   */
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) return existingProxy as T

  /**
   *   不能将代理对象接着代理 解决⬇️
   *   const obj = { a: 0 }
   *   const state = reactive(obj)
   *   const state2 = reactive(state)
   */
  if (reactiveSet.has(target)) return target
  const proxy = new Proxy(target, mutableHandlers)

  reactiveMap.set(target, proxy)
  reactiveSet.add(proxy)
  return proxy as T
}

// ==================== 导出函数 ====================

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target)
}

export function isReactive(target: any): target is object {
  return reactiveSet.has(target)
}
