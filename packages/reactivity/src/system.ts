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
  const newLink = {
    sub,
    nextSub: undefined,
    prevSub: undefined
  }
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
