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

let linkPool: Link

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

  //region Description 清理掉的节点和新创建的节点 保持复用
  let newLink: Link | undefined

  /**
   * linkPoll 表示是否被清理的节点，留着复用
   */
  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      prevSub: undefined
    }
  }
  //endregion

  //region Desc: 将列表节点和 dep 建立关联关系
  /**
   * 链表关系关联
   * 1. 如果存在尾节点，就往尾节点后面加
   * 2. 如果不存在尾节点表示第一次关联，就往头节点加，头尾相同
   */
  if (dep.subsTail) {
    /**
     * 1. 将尾节点的下一个指向新节点
     * 2. 将新节点的上一个指向尾节点
     * 3. 将尾节点指向新节点
     */
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
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

/**
 * 依赖追踪开始 将尾节点设置成 undefined
 * @param sub
 */
export function startTrack(sub) {
  // 标记为 undefined 表示被 dep 触发了重新执行，并尝试复用 link 节点
  sub.depsTail = undefined
}

/**
 * 结束追踪，找到要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub) {
  const depsTail = sub.depsTail
  /**
   * depsTail 有，并且 depsTail 还有 nextDep，应该给它的依赖关系清理掉
   * depsTail 没有，并且有头节点，那就把所有的都清理掉
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 * 清理依赖关系
 * @param link
 */
function clearTracking(link: Link) {
  while (link) {
    const { prevSub, nextSub, nextDep, dep } = link

    /**
     * 如果 prevSub 有，那么就把 prevSub 的下一节点指向当前节点的下一个
     * 如果没有的话 那么就是头节点，就把 dep.subs 指向当前节点的下一个
     */

    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
     *  如果没有的话 那么就是尾节点，就把 dep.depsTail 指向当前节点的上一个
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    link.dep = link.sub = undefined

    /**
     * 将不要的节点给 linkPoll 保持复用
     */
    link.nextDep = linkPool
    linkPool = link

    link = nextDep
  }
}
