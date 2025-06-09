import { type Link } from './system'

export let activeSub // 保存当前正在执行的 effect

export class ReactiveEffect {
  // 依赖项列表的尾节点
  depsTail: Link | undefined

  constructor(public fn) {}

  run() {
    const prevSub = activeSub // 将当前的 effect 嵌套起来，用来处理嵌套的逻辑

    // 每次执行 fn 之前，将 this 放到 activeSub 上
    activeSub = this
    // 标记为 undefined 表示被 dep 触发了重新执行，并尝试复用 link 节点
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      endTrack(this)
      // 恢复为之前的 activeSub
      activeSub = prevSub
    }
  }

  /**
   * 默认调用run，如果传递了 scheduler 则使用传递的
   * 也就是 原型方法和实例方法的优先级
   */
  scheduler() {
    this.run()
  }

  /**
   * 如果依赖发生变化，通知更新
   */
  notify() {
    this.scheduler()
  }
}

function endTrack(sub) {
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

    link.nextDep = undefined

    link = nextDep
  }
}

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)

  Object.assign(e, options)
  e.run()

  const runner = () => e.run()
  runner.effect = e
  return runner
}
