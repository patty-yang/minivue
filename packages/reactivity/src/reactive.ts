import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandles'

export function reactive(target) {
  return createReactiveObject(target)
}

const reactiveMap = new WeakMap() // 保存 target 和 响应式对象之间的关联关系

const reactiveSet = new WeakSet() // 保存所有使用 reactive 创建出来的响应式对象

function createReactiveObject(target) {
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
  if (existingProxy) return existingProxy

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
  return proxy
}

export function isReactive(target) {
  return reactiveSet.has(target)
}
