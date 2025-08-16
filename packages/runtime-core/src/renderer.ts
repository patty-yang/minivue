export function createRenderer(options) {
  console.log('options ==> ', options)
  /**
   * 将虚拟节点渲染到页面上的功能
   */
  const render = (vnode, container) => {}

  return {
    render,
    createApp(rootComponent) {
      return {
        mount(container) {}
      }
    }
  }
}
