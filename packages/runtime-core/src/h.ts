import { isArray, isObject } from '@vue/shared'

/**
 * h 函数的使用方法
 * 1. h('div', 'Hello World') 第二个参数为子节点
 * 2. h('div', [h('span', 'hello'), h('span', 'world')]) 第二个参数为子节点
 * 3. h('div',h('span', 'hello') 第二个参数为子节点
 * 4. h('div', { class: 'container' }, 'hello world') 第二个参数为 props
 * -----
 *
 * 5. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
 */

/**
 * 如果是虚拟节点的话 有一个__v_v_isVNode 属性
 */
function isVNode(value) {
  return value?.__v_isVNode
}

export function h(type, propsOrChildren?, children?) {
  /**
   * h 函数，主要的作用是对 createVNode 做一个参数标准化(参数规一)
   */

  let l = arguments.length

  if (l === 2) {
    if (isArray(propsOrChildren)) {
      // h('div', [h('span', 'hello'), h('span', 'world')])
      return createVNode(type, null, propsOrChildren)
    }

    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('span','hello'))
        return createVNode(type, null, [propsOrChildren])
      }
      // h('div', { class: 'container' }, 'hello world')
      return createVNode(type, propsOrChildren, children)
    }

    // h('span','hello world')
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      /**
       *   h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
       */
      children = [...arguments].slice(2)
    }
    // h('div', { class: 'container' }, h('span', 'hello'),)
    else if (isVNode(children)) {
      children = [children]
    }

    return createVNode(type, propsOrChildren, children)
  }
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 */
function createVNode(type, props?, children?) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // diff
    key: props?.key,
    // 虚拟节点 要挂载的元素
    el: null,
    shapeFlag: 9
  }

  return vnode
}
