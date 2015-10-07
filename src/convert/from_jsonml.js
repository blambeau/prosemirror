import {Pos, style} from "../model"
import {defineSource} from "./index"

export function fromJsonML(schema, jml) {
  let state = new State(schema), doc
  apply(jml, state)
  do { doc = closeNode(state) } while (state.stack.length)
  if (!Pos.start(doc)) doc = doc.splice(0, 0, [schema.node("paragraph")])
  return doc
}

defineSource("jsonml", fromJsonML)

///

function addNode(state, type, attrs, content) {
  let node = state.schema.node(type, attrs, content)
  state.push(node)
  return node
}

function openNode(state, type, attrs) {
  state.stack.push({type: type, attrs: attrs, content: []})
}

function closeNode(state) {
  if (state.styles.length) state.styles = []
  let info = state.stack.pop()
  return addNode(state, info.type, info.attrs, info.content)
}

function openInline(state, add) {
  state.styles = style.add(state.styles, add)
}

function closeInline(state, rm) {
  state.styles = style.remove(state.styles, rm)
}

function addInline(state, type, text = null, attrs = null) {
  let node = state.schema.node(type, attrs, text, state.styles)
  state.push(node)
  return node
}

function addText(state, text) {
  let nodes = state.top().content, last = nodes[nodes.length - 1]
  let node = state.schema.text(text, state.styles), merged
  if (last && (merged = last.maybeMerge(node))) nodes[nodes.length - 1] = merged
  else nodes.push(node)
}

///

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
  openNode(state, tag)
  applyChildren(jml, state)
  closeNode(state)
}

///

const tokens = Object.create(null)

tokens.article    = (jml, state) => applyChildren(jml, state)
tokens.section    = (jml, state) => applyChildren(jml, state)
tokens.span       = (jml, state) => applyChildren(jml, state)
tokens.p          = (jml, state) => pushAndApplyChildren("paragraph", jml, state)
tokens.ul         = (jml, state) => pushAndApplyChildren("bullet_list", jml, state)
tokens.ol         = (jml, state) => pushAndApplyChildren("ordered_list", jml, state)
tokens.li         = (jml, state) => pushAndApplyChildren("list_item", jml, state)
tokens.blockquote = (jml, state) => pushAndApplyChildren("blockquote", jml, state)
tokens.pre        = (jml, state) => pushAndApplyChildren("code_block", jml, state)
tokens.string     = (jml, state) => addText(state, jml)
tokens.br         = (jml, state) => addInline(state, "hard_break")

tokens.h1 = tokens.h2 = tokens.h3 = tokens.h4 = tokens.h5 = tokens.h6 = function(jml, state) {
  openNode(state, "heading", { level: Number(jml[0].substring(1)) })
  applyChildren(jml, state)
  closeNode(state)
}

tokens.$ = (jml, state) => {
  let expr = jsonml.getAttribute(jml, "expr")
  addText(state, "${" + expr + "}")
}

function applyStyle(style, onEmpty = "") {
  return function(jml, state) {
    let sty = (typeof(style) === 'function') ? style(jml) : style
    openInline(state, sty)
    applyChildren(jml, state)
    closeInline(state, sty)
  }
}

tokens.em     = applyStyle(style.em)
tokens.strong = applyStyle(style.strong)
tokens.code   = applyStyle(style.code)
tokens.a      = applyStyle((jml) => style.link(jsonml.getAttribute(jml,"href"),jsonml.getAttribute(jml,"title")))

class State {
  constructor(schema) {
    this.schema = schema
    this.stack = [ {type: "doc", content: []} ]
    this.styles = [ ]
  }

  top() {
    return this.stack[this.stack.length-1]
  }

  push(node) {
    if (this.stack.length)
      this.top().content.push(node)
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
