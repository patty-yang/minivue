/**
 * 依赖项链表
 */
interface Sub {
  deps: Link | undefined
  // 依赖项列表的尾节点
  depsTail: Link | undefined
}

/**
 * 订阅者链表
 */
interface Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}

export interface Link {
  sub: Sub // 保存的effect
  dep: Dep // 节点的依赖项
  nextDep: Link | undefined // 下一个依赖项节点
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

  const currentDep = sub.depsTail
  /**
   * 节点复用的两种情况
   * 1. sub.depsTail 没有，并且 sub.deps 有，表示要复用头节点
   * 2. 如果尾节点有 nextDep，这种情况下要尝试复用尾节点的 nextDep
   */

  // if (currentDep === undefined && sub.deps) {
  //   // 尾节点有，头节点有
  //   if (sub.deps.dep === dep) {
  //     // 移动尾指针，指向刚刚复用的链表节点
  //     sub.depsTail = sub.deps
  //     return
  //   }
  // } else if (currentDep) {
  //   if (currentDep.nextDep?.dep === dep) {
  //     sub.depsTail = currentDep.nextDep
  //     // 如果尾节点存在，并且尾节点还存在 nextDep 就尝试复用尾节点的 nextDep
  //     return
  //   }
  // }
  // 优化后 ->
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    // 如果 nextDep.dep 等于我当前要收集的 dep
    sub.depsTail = nextDep
    return
  }
  const newLink = {
    sub,
    dep,
    nextDep,
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
