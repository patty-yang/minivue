import { hasChanged, isFunction } from '@vue/shared'
import { ReactiveFlags, Ref } from './ref'
import { Dependency, endTrack, link, Link, startTrack, Sub } from './system'
import { activeSub, setActiveSub } from './effect'

// ==================== 类型定义 ====================

export interface ComputedRef<T = any> extends Ref<T> {
  readonly value: T
}

export interface ComputedGetter<T> {
  (): T
}

export interface ComputedSetter<T> {
  (value: T): void
}

export interface ComputedOptions<T> {
  get: ComputedGetter<T>
  set?: ComputedSetter<T>
}

// ==================== 核心类 ====================

// implements 约束这个类必须实现 implements 后面所有的的属性
class ComputedRefImpl<T> implements Dependency, Sub, ComputedRef<T> {
  // computed 也是一个 ref, 通过 isRef = true
  [ReactiveFlags.IS_REF] = true as const

  // 保存 fn 的返回值
  _value!: T

  //region Description: 作为 dep,要关联 subs 等值更新了 要通知重新执行
  subs: Link
  subsTail: Link
  //endregion

  //region Description: 作为 sub,要保存 哪些 dep 被收集了
  deps: Link | undefined
  depsTail: Link | undefined
  tracking = false

  //endregion

  dirty = true // 是否脏了，脏了就需要重新计算

  constructor(
    public fn: ComputedGetter<T>,
    private setter?: ComputedSetter<T>
  ) {}

  get value(): T {
    if (this.dirty) {
      this.update()
    }

    /**
     *  作为 dep时，要和 sub 做关联关系
     */

    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue: T) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('readonly')
    }
  }

  update(): boolean {
    /**
     * 实现 sub 的功能，味了在执行 fn 期间，收集 fn 执行过程中访问到的响应式数据
     * 建立 dep 和 sub 之间的关联关系
     */
    const prevSub = activeSub

    setActiveSub(this)
    startTrack(this)

    try {
      const oldValue = this._value
      this._value = this.fn()
      return hasChanged(this._value, oldValue)
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }
}

// ==================== 导出函数 ====================

/**
 *  计算属性
 * @param getterOrOptions 可能是一个函数，可能是一个对象。 如果是对象的话，对象里有 get set 两个函数
 */
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | ComputedOptions<T>
): ComputedRef<T> {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T> | undefined

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions as ComputedGetter<T>
    setter = undefined
  } else {
    const options = getterOrOptions as ComputedOptions<T>
    getter = options.get
    setter = options.set
  }

  return new ComputedRefImpl(getter, setter)
}
