import { isArray, isString, ShapeFlags } from '@vue/shared'

/**
 * 如果是虚拟节点的话 有一个__v_v_isVNode 属性
 */
export function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  /**
   * 9: type 是 dom 元素的类型，children 是一个字符串
   */

  let shapeFlag

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // diff
    key: props?.key,
    // 虚拟节点 要挂载的元素
    el: null,

    shapeFlag
  }

  return vnode
}
