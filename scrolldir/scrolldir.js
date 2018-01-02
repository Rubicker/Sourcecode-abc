// 为将 data-scrolldir 属性添加到 HTML 标签作准备
let attribute = 'data-scrolldir'
let dir = 'down' // 'up' or 'down'
// 获取到 HTML 标签
let el = document.documentElement
let win = window
const body = document.body
const historyLength = 32 // Ticks to keep in history.
const historyMaxAge = 512 // History data time-to-live (ms).
const thresholdPixels = 64 // Ignore moves smaller than this.
const history = Array(historyLength)
let e // last scroll event
let pivot // "high-water mark"
let pivotTime = 0

function tick() {
  /*
   * 这里获取文档在垂直方向已滚动的像素值
   *  IE9 不支持 window.scrollY
   *  TODO： 这里应该直接用 win.pageYOffset
   */
  let y = win.scrollY || win.pageYOffset
  const t = e.timeStamp
  const furthest = dir === 'down' ? Math.max : Math.min

  /*
   *  body.offsetHeight 返回 body 像素高度（包含垂直内边距及边框），且为整数
   *  MDN：https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/offsetHeight
   */
  // Apply bounds to handle rubber banding
  const yMax = body.offsetHeight - win.innerHeight
  y = Math.max(0, y)
  y = Math.min(yMax, y)

  // Update history
  history.unshift({ y, t })
  history.pop()

  // Are we continuing in the same direction?
  if (y === furthest(pivot, y)) {
    // Update "high-water mark" for current direction
    pivotTime = t
    pivot = y
    return
  }
  // else we have backed off high-water mark

  // Apply max age to find current reference point
  const cutoffTime = t - historyMaxAge
  if (cutoffTime > pivotTime) {
    pivot = y
    for (let i = 0; i < historyLength; i += 1) {
      if (!history[i] || history[i].t < cutoffTime) break
      pivot = furthest(pivot, history[i].y)
    }
  }

  // Have we exceeded threshold?
  if (Math.abs(y - pivot) > thresholdPixels) {
    pivot = y
    pivotTime = t
    dir = dir === 'down' ? 'up' : 'down'
    el.setAttribute(attribute, dir)
  }
}

function handler(event) {
  e = event
  return win.requestAnimationFrame(tick)
}

export default function scrollDir(opts) {
  if (opts) {
    if (opts.attribute) attribute = opts.attribute
    if (opts.el) el = opts.el
    if (opts.win) win = opts.win
    if (opts.dir) dir = opts.dir
    // If opts.off, turn it off
    // - set html[data-scrolldir="off"]
    // - remove the event listener
    if (opts.off === true) {
      el.setAttribute(attribute, 'off')
      return win.removeEventListener('scroll', handler)
    }
  }

  // else, turn it on
  // - set html[data-scrolldir="down"]
  // - add the event listener
  pivot = win.scrollY || win.pageYOffset
  el.setAttribute(attribute, dir)
  return win.addEventListener('scroll', handler)
}
