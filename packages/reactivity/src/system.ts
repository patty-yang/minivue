import { ReactiveEffect } from './effect'

export interface Link {
  sub: ReactiveEffect // 保存的effect
  nextSub: Link | undefined // 下一个节点
  prevSub: Link | undefined // 上一个节点
}

/**
 * 建立链表关系
 * @param dep
 * @param sub
 */
export function link(dep, sub) {
  // 如果 dep 和 sub 创建过关联关系，那么就复用一下 不创建关联关系

  const curDep = sub.depsTail
  /**
   * 节点复用的两种情况
   * sub.depsTail 没有，并且 sub.deps 有，表示要复用头节点
   */

  debugger
  if (curDep === undefined && sub.deps) {
    // 尾节点有，头节点有
    if (sub.deps.dep === dep) return
  }
  const newLink = {
    sub,
    dep,
    nextDep: undefined,
    nextSub: undefined,
    prevSub: undefined
  }
  //region Desc: 将列表节点和 dep 建立关联关系
  /**
   * 链表关系关联
   * 1. 如果存在尾节点，就往尾节点后面加
   * 2. 如果不存在尾节点表示第一次关联，就往头节点加，头尾相同
   */
  if (dep.subTail) {
    /**
     * 1. 将尾节点的下一个指向新节点
     * 2. 将新节点的上一个指向尾节点
     * 3. 将尾节点指向新节点
     */
    dep.subTail.nextSub = newLink
    newLink.prevSub = dep.subTail
    dep.subTail = newLink
  } else {
    dep.subs = newLink
    dep.subTail = newLink
  }
  //endregion

  //region Desc:  将链表节点和 sub 建立关联关系
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
  //endregion
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  let queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}
