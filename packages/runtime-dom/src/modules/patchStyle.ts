export function patchStyle(el, prevValue, nextValue) {
  const style = el.style
  if (nextValue) {
    /**
     * 把新的样式全部设置到 style 傻姑娘
     */
    for (const key in nextValue) {
      style[key] = nextValue[key] || {}
    }
  }

  if (prevValue) {
    /**
     * 把之前有的，现在没有的 给删除
     * 之前是 {background: 'red' } => {color: 'red'} 就删除 background，应用 color
     */
    for (const key in prevValue) {
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}