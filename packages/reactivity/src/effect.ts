export let activeSub // 保存当前正在执行的 effect

export function effect(fn) {
  activeSub = fn
  activeSub()
  activeSub = undefined
}
