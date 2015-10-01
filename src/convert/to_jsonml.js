import {style} from "../model"
import {defineTarget} from "./index"

export function toJsonML(doc) {
  let state = new State
  renderNodesInto(doc.content, state)
  return state.stack[0]
}

defineTarget("jsonml", toJsonML)

const renderers = Object.create(null)

function renderNodesInto(nodes, state) {
  for (let i=0; i<nodes.length; i++) {
    renderNode(nodes[i], state)
  }
}

function renderNode(node, state) {
  let r = renderers[node.type.name]
  if (!r) throw new Error("Unexpected node type " + node.type.name)
  return r(node, state)
}

function renderBlock(tag) {
  return function(node, state) {
    state.open([ typeof(tag) === 'function' ? tag(node) : tag ])
    renderNodesInto(node.content, state)
    state.close()
  }
}

renderers.paragraph    = renderBlock('p')
renderers.bullet_list  = renderBlock('ul')
renderers.ordered_list = renderBlock('ol')
renderers.list_item    = renderBlock('li')
renderers.blockquote   = renderBlock('blockquote')
renderers.code_block   = renderBlock('pre')
renderers.hard_break   = renderBlock('br')
renderers.heading      = renderBlock((node) => 'h' + node.attrs.level)

renderers.text = function(node, state) {
  state.applyStyle(node.styles)
  state.push(node.text)
}

const stylers = Object.create(null)

function styler(tag) {
  return function(style, state) {
    state.open([tag])
  }
}

stylers.strong = styler('strong')
stylers.em     = styler('em')
stylers.code   = styler('code')

stylers.link = function(style, state) {
  state.open(['a'])
  state.push({href: style.href})
}

stylers.tag = function(style, state) {
  state.open(['$'])
  state.push({expr: style.expr})
}

///

class State {
  constructor() {
    this.stack  = [ [ 'article' ] ]
    this.styles = [ ]
  }

  top() {
    return this.stack[this.stack.length-1]
  }

  push(jml) {
    this.top().push(jml)
  }

  open(jml) {
    this.push(jml)
    this.stack.push(jml)
  }

  openStyles(styles) {
    for (let i=0; i<styles.length; i++) this.openStyle(styles[i])
  }

  openStyle(sty) {
    if (style.contains(this.styles, sty)) return;
    let r = stylers[sty.type]
    if (!r) throw new Error("Unexpected style " + sty.type)
    this.styles.push(sty)
    r(sty, this)
  }

  close() {
    this.closeStyles()
    this.stack.pop()
  }

  closeStyles(start = 0) {
    for (let i=start; i<this.styles.length; i++) this.stack.pop()
    this.styles = this.styles.slice(0,start)
  }

  applyStyle(styles) {
    for (let i=this.styles.length-1; i>=0; i--) {
      if (style.contains(styles, this.styles[i])) continue;
      this.closeStyles(i)
      break;
    }
    this.openStyles(styles)
  }
}