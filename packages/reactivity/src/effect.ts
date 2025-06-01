export let activeSub // 保存当前正在执行的 effect

export class ReactiveEffect {
  constructor(public fn) {}

  run() {
    const prevSub = activeSub // 将当前的 effect 嵌套起来，用来处理嵌套的逻辑

    // 每次执行 fn 之前，将 this 放到 activeSub 上
    activeSub = this
    try {
      return this.fn()
    } finally {
      // 恢复为之前的 activeSub
      activeSub = prevSub
    }
  }
}

export function effect(fn) {
  const e = new ReactiveEffect(fn)

  e.run()
}
