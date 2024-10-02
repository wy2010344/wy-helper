




export function subscribeBalanceSize(dir: 'width' | 'height', ...vs: HTMLElement[]) {
  let maxWidth = 0
  const reOb = new ResizeObserver(e => {
    let tempMax = maxWidth
    e.forEach(r => {
      tempMax = Math.max(tempMax, r.contentRect[dir])
    })
    if (tempMax != maxWidth) {
      maxWidth = tempMax
      vs.forEach(v => {
        v.style[dir] = maxWidth + 'px'
      })
    }
  })
  vs.forEach(v => {
    reOb.observe(v)
  })
  return () => {
    reOb.disconnect()
  }
}