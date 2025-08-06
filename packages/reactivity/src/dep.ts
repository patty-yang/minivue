import { activeSub } from './effect'
import { Dependency, link, Link, propagate } from './system'

// ==================== 类型定义 ====================

class Dep implements Dependency {
  subs: Link | undefined // 订阅者链表的头节点
  subsTail: Link | undefined // 订阅者链表的尾节点
  constructor() {}
}

// ==================== 全局变量 ====================

/**
 * 绑定 target 的 key 关联的所有的 Dep
 *
 * obj = {a:0,b:1}
 * targetMap = {
 *   [obj]: {
 *     a: Dep,
 *     b: Dep
 *   }
 * }
 */
const targetMap = new WeakMap<object, Map<string | symbol, Dep>>()

// ==================== 导出函数 ====================

export function track(target: object, key: string | symbol): void {
  if (!activeSub) return

  /**
   * 查找 = {
   *     a: Dep,
   *     b: Dep
   *   }
   */
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    /**
     * 如果没有收集过依赖
     *  就创建一个新的 用来保存 target 与 depsMap 之间的关联关系
     */
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    /**
     * 创建一个新的 并报错到 depsMap 中
     */
    dep = new Dep()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)
}

export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) return //  表示这个对象没有任何属性再 sub 中访问过，没建立上关联关系

  const targetIsArray = Array.isArray(target)
  if (targetIsArray && key === 'length') {
    /**
     * 更新数组的 length
     * 更新前 length = 4 => ['a', 'b', 'c', 'd']
     * 更新后 length = 1 => ['a']
     *  结论: 要通知访问了 b c d 的 effect 重新执行，就是访问量大于等于 length 的索引
     *  depsMap = {
     *    0: Dep,
     *    1: Dep,
     *    2: Dep,
     *    3: Dep,
     *    length: Dep
     *  }
     */

    const length = target.length
    depsMap.forEach((dep, depKey) => {
      // 只有当 depKey 是数字类型的字符串时才进行比较，避免对 symbol 类型使用一元加号
      if (Number(depKey) >= length || depKey === 'length') {
        propagate(dep.subs)
      }
    })
  } else {
    // 不是数组，或者数组更新的不是 length
    const dep = depsMap.get(key) // dep => Dep
    if (!dep) return // key 没在 sub 中访问过

    propagate(dep.subs)
  }
}
