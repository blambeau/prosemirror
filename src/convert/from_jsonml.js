import {Node, Span, Pos, style} from "../model"
import {defineSource} from "./index"

export function fromJsonML(jml) {
  let state = new State()
  apply(jml, state)
  return state.stack[0]
}

defineSource("jsonml", fromJsonML)

const tokens = Object.create(null)

function apply(jml, state) {
  let renderer = (typeof(jml) === "string") ? "string" : jml[0]
  if (!tokens[renderer]) throw new Error("Unexpected tag " + renderer)
  tokens[renderer](jml, state)
}

function applyChildren(jml, state) {
  let start = (jsonml.hasAttributes(jml) ? 2 : 1), i
  for (i=start; i<jml.length; i++) {
    apply(jml[i], state)
  }
}

function pushAndApplyChildren(tag, jml, state) {
  state.open(tag)
  applyChildren(jml, state)
  state.close()
}

tokens.article    = (jml, state) => applyChildren(jml, state)
tokens.section    = (jml, state) => applyChildren(jml, state)
tokens.span       = (jml, state) => applyChildren(jml, state)
tokens.p          = (jml, state) => pushAndApplyChildren("paragraph", jml, state)
tokens.ul         = (jml, state) => pushAndApplyChildren("bullet_list", jml, state)
tokens.ol         = (jml, state) => pushAndApplyChildren("ordered_list", jml, state)
tokens.li         = (jml, state) => pushAndApplyChildren("list_item", jml, state)
tokens.blockquote = (jml, state) => pushAndApplyChildren("blockquote", jml, state)
tokens.pre        = (jml, state) => pushAndApplyChildren("code_block", jml, state)
tokens.string     = (jml, state) => state.pushSpan("text", {}, [], jml)
tokens.br         = (jml, state) => state.pushSpan("hard_break")

tokens.h1 = tokens.h2 = tokens.h3 = tokens.h4 = tokens.h5 = tokens.h6 = function(jml, state) {
  state.open("heading", { level: Number(jml[0].substring(1)) })
  applyChildren(jml, state)
  state.close()
}

function applyStyle(style, onEmpty = "") {
  return function(jml, state) {
    let sty = (typeof(style) === 'function') ? style(jml) : style
    applyChildren(jml, state)
    state.applyStyle(sty, jsonml.childCount(jml))
  }
}

tokens.em     = applyStyle(style.em)
tokens.strong = applyStyle(style.strong)
tokens.code   = applyStyle(style.code)
tokens.a      = applyStyle((jml) => style.link(jsonml.getAttribute(jml,"href"),jsonml.getAttribute(jml,"title")))
tokens.$      = (jml,state) => {
  let expr = jsonml.getAttribute(jml, "expr")
  let sty = style.tag(expr)
  if (jsonml.isEmpty(jml)) {
    state.aboutToText(() => {
      state.pushSpan("text", {}, [], expr)
      state.applyStyle(sty, 1)
    })
  } else {
    applyChildren(jml, state)
    state.applyStyle(sty, jsonml.childCount(jml))
  }
}

class State {
  constructor() {
    this.stack = [ new Node("doc") ]
  }

  top() {
    return this.stack[this.stack.length-1]
  }

  push(node) {
    this.top().push(node)
  }

  pushSpan(type, attrs = {}, styles = [], text = null) {
    let span = new Span(type, attrs, styles, text)
    this.push(span)
  }

  aboutToText(callback) {
    let top = this.top()
    if (top.type.contains !== 'span') {
      this.open(top.type.contains === "list_item" ? "list_item" : "paragraph")
      callback()
      this.close()
    } else {
      callback()
    }
  }

  open(kind, attrs = null) {
    let child = new Node(kind, attrs)
    this.push(child)
    this.stack.push(child)
  }

  close() {
    this.stack.pop()
  }

  applyStyle(sty, count) {
    let content = this.top().content, last
    for (let i=1; i<=count; i++) {
      last = content[content.length-i]
      last.styles = style.add(last.styles, sty)
    }
  }
}
// Some JsonML utilities

const jsonml = Object.create(null)

jsonml.isArray       = (val) => (val instanceof Array)
jsonml.isString      = (val) => ("string" === typeof val)
jsonml.isElement     = (jml) => jsonml.isArray(jml) && ("string" === typeof jml[0])
jsonml.isAttributes  = (jml) => !!jml && ("object" === typeof jml) && !jsonml.isArray(jml)
jsonml.isEmpty       = (jml) => (jml.length <= 1) || (jml.length === 2 && jsonml.hasAttributes(jml))
jsonml.hasAttributes = (jml) => jsonml.isAttributes(jml[1])
jsonml.childCount    = (jml) => jml.length - (jsonml.hasAttributes(jml) ? 2 : 1)
jsonml.getAttributes = (jml) => jsonml.hasAttributes(jml) ? jml[1] : {}
jsonml.getAttribute  = (jml,name) => jsonml.hasAttributes(jml) ? jml[1][name] : null
