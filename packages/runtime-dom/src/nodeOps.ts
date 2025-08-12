// 封装 dom 节点操作 API
export const nodeOps = {
  // 插入节点
  insert(el, parent, anchor = null) {
    // 如果第二个参数是 null，则 = appendChild
    parent.insertBefore(el, anchor)
  },
  // 创建元素
  createElement(type) {
    return document.createElement(type)
  },
  // 移除元素
  remove(el) {
    const parentNode = el.parentNode
    if (parentNode) {
      parentNode.removeChild(el)
    }
  },
  // 设置元素 text
  createText(text) {
    return document.createTextNode(text)
  },
  // 创建文本节点
  setText(el, text) {
    el.textNode = text
  },
  // 设置 node value
  setElementText(el, text) {
    el.textContent = text
  },
  // 获取下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling
  },
  // dom 查询
  querySelector(selector) {
    return document.querySelector(selector)
  }
}
