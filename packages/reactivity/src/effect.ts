export let activeSub // 保存当前正在执行的 effect

export class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // 每次执行 fn 之前，将 this 放到 activeSub 上
    activeSub = this
    try {
      return this.fn()
    } finally {
      activeSub = undefined
    }
  }
}

export function effect(fn) {
  const e = new ReactiveEffect(fn)
  e.run()
}
