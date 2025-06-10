import { endTrack, type Link, startTrack } from './system'

export let activeSub // 保存当前正在执行的 effect

export class ReactiveEffect {
  // 依赖项列表的尾节点
  depsTail: Link | undefined

  constructor(public fn) {}

  run() {
    const prevSub = activeSub // 将当前的 effect 嵌套起来，用来处理嵌套的逻辑

    // 每次执行 fn 之前，将 this 放到 activeSub 上
    activeSub = this
    startTrack(this)

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

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)

  Object.assign(e, options)
  e.run()

  const runner = () => e.run()
  runner.effect = e
  return runner
}
