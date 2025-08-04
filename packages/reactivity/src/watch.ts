import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isObject } from '@vue/shared'

function traverse(value, seen = new Set()) {
  if (!isObject(value)) return value

  if (seen.has(value)) return value

  seen.add(value)

  for (const key in value) {
    traverse(value[key], seen)
  }

  return value
}

export function watch(source, cb, options) {
  const { immediate, once, deep } = options || {}
  if (once) {
    // 如果传递了 once 就保存一份 cb 执行完原回掉之后，停止监听
    const _cb = cb

    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }
  let getter
  if (isRef(source)) {
    getter = () => source.value
  }

  if (deep) {
    const baseGetter = getter

    getter = () => traverse(baseGetter())
  }
  let oldValue

  function job() {
    // 执行 effect 的 run 拿到getter 的返回值，不能直接执行 getter 因为要收集依赖
    const newValue = effect.run()

    cb(newValue, oldValue)
    // 下一次的 oldValue 是当前的 newValue
    oldValue = newValue
  }

  function stop() {
    return effect.stop()
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    // 拿到 oldValue，并且收集依赖
    oldValue = effect.run()
  }

  return stop
}
