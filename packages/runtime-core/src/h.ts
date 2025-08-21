import { isArray, isObject, ShapeFlags } from '@vue/shared'
import { createVNode, isVNode } from './vnode'

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

// let shapeFlag = 0
//
// const vnode = {
//   __v_isVNode: true,
//   type: 'div',
//   children: 'hello world',
//   shapeFlag
// }
//
// if (typeof vnode.type === 'string') {
//   // vnode.type 是一个字符串，表示 DOM 元素
//   shapeFlag |= ShapeFlags.ELEMENT // 1
// }
//
// if (typeof vnode.children === 'string') {
//   /**
//    * 或运算 有一个1 就是 1
//    * 0001
//    * 1000
//    * 结果是 1001
//    */
//   // shapeFlag = shapeFlag | ShapeFlags.TEXT_CHILDREN // 1001
//   shapeFlag |= ShapeFlags.ELEMENT
// }
// vnode.shapeFlag = shapeFlag
//
// if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
//   /**
//    * 与运算
//    * 1001
//    * 0001
//    * 结果是 0001
//    */
//   console.log('这是一个 DOM 元素的虚拟节点')
// }
//
// if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
//   /**
//    * 1001
//    * 1000
//    * 结果为 1001
//    */
//
//   console.log('子元素是一个纯文本节点')
// }
//
// if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
//   /**
//    * 01001
//    * 10000
//    * 结果为 00000
//    */
//   console.log('子元素是一个数组')
// }
