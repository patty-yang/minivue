import { isFunction } from '@vue/shared'
import { ReactiveFlags } from './ref'
import { Dependency, endTrack, link, Link, startTrack, Sub } from './system'
import { activeSub, setActiveSub } from './effect'

// implements 约束这个类必须实现 implements 后面所有的的属性
class ComputedRefImpl implements Dependency, Sub {
  // computed 也是一个 ref, 通过 isRef = true
  [ReactiveFlags.IS_REF] = true

  // 保存 fn 的返回值
  _value

  //region Description: 作为 dep,要关联 subs 等值更新了 要通知重新执行
  subs: Link
  subsTail: Link
  //endregion

  //region Description: 作为 sub,要保存 哪些 dep 被收集了
  deps: Link | undefined
  depsTail: Link | undefined
  tracking = false

  //endregion

  constructor(
    public fn,
    private setter
  ) {}

  get value() {
    this.update()

    /**
     *  要和 sub 做关联关系
     */

    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('readonly')
    }
  }

  update() {
    /**
     * 实现 sub 的功能，味了在执行 fn 期间，收集 fn 执行过程中访问到的响应式数据
     * 建立 dep 和 sub 之间的关联关系
     */
    const prevSub = activeSub

    setActiveSub(this)
    startTrack(this)

    try {
      this._value = this.fn()
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }
}

/**
 *  计算属性
 * @param getteroroptions 可能是一个函数，可能是一个对象。 如果是对象的话，对象里有 get set 两个函数
 */
export function computed(getteroroptions) {
  let getter
  let setter

  if (isFunction(getteroroptions)) {
    getter = getteroroptions
    setter = () => {}
  } else {
    getter = getteroroptions.get
    setter = getteroroptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
