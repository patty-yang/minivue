import { activeSub } from './effect'

interface Link {
  sub: Function // 保存的effect
  nextSub: Link | undefined // 下一个节点
  prevSub: Link | undefined // 上一个节点
}
enum ReactiveFlags {
  IS_REF = '__v_isRef'
}

/**
 * Ref 的类
 */
class RefImpl {
  _value; // 保存实际的值
  [ReactiveFlags.IS_REF] = true // ref 标记，是否是一个 ref
  subs: Link // 订阅者链表的头节点
  subTail: Link // 订阅者链表的尾节点
  constructor(value) {
    this._value = value
  }

  get value() {
    // 收集依赖
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    // 派发更新
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关联关系
 * @param dep
 */
export function trackRef(dep) {
  const newLink = {
    sub: activeSub,
    nextSub: undefined,
    prevSub: undefined
  }
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
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep
 */
export function triggerRef(dep) {
  let link = dep.subs
  let queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect())
}
