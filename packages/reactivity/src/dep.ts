import { activeSub } from './effect'
import { Link, link, propagate } from './system'

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
const targetMap = new WeakMap()

export function track(target, key) {
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

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return //  表示这个对象没有任何属性再 sub 中访问过，没建立上关联关系
  const dep = depsMap.get(key) // dep => Dep
  if (!dep) return // key 没在 sub 中访问过

  propagate(dep.subs)
}

class Dep {
  subs: Link // 订阅者链表的头节点
  subsTail: Link // 订阅者链表的尾节点
  constructor() {}
}
