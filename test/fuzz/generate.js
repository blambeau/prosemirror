import {Node, Span, nodeTypes, style} from "../../src/model"

import {text} from "./tao"

export const attrs = {
  image: {src: "http://image", alt: "my image"},
  html_block: {html: "<block>foo</block>"},
  html_tag: {html: "<span>tag</span>"},
  heading: {level: 1}
}

export function createNode(type, fuel) {
  let node = new Node(type, attrs[type.name])
  if (type.contains == "span")
    fillNodeInline(node, fuel)
  else if (type.contains)
    fillNode(node, fuel)
  return node
}

export function createDoc(fuel) {
  return createNode(nodeTypes.doc, fuel || 1)
}

function childTypes(type, omit) {
  let contains = type.contains, result = []
  for (var name in nodeTypes) {
    let cur = nodeTypes[name]
    if (cur.type == contains && cur != omit) result.content.push(cur)
  }
  return result
}

function fillNode(node, fuel) {
  let types = childTypes(node.type)
  if (types.length == 0) return

  let children = Math.ceil(fuel * 5)
  for (let i = 0; i < children; i++) {
    let type = types[Math.floor(Math.random() * types.length)]
    node.content.push(createNode(type, fuel * 0.66))
  }
}

function fillNodeInline(node, fuel) {
  if (node.type.plainText || Math.random() < .6) {
    node.content.push(new Span.text(randomText(40)))
  } else {
    let types = childTypes(node.type, nodeTypes.text)
    let children = Math.ceil(fuel * 10)
    let styles = randomStyles()
    for (let i = 0; i < children; i++) {
      if (Math.random() < .75) {
        styles = modifyStyles(styles)
        node.content.push(Span.text(randomText(20), styles))
      } else {
        let type = types[Math.floor(Math.random() * types.length)]
        node.content.push(new Span(type, attrs[type.name], styles))
      }
    }
  }
}

function randomStyles() {
  let styles = []
  if (Math.random() < .3) styles.push(style.em)
  if (Math.random() < .2) styles.push(style.strong)
  if (Math.random() < .2) styles.push(style.link("http://foobar"))
  if (Math.random() < .1) styles.push(style.code)
  return styles
}

function toggleStyle(styles, st) {
  if (style.contains(styles, st))
    return style.remove(styles, st)
  else
    return style.add(styles, st)
}

function modifyStyles(styles) {
  let rnd = Math.random()
  if (rnd < .3) return toggleStyle(styles, style.em)
  if (rnd < .6) return toggleStyle(styles, style.strong)
  if (rnd < .85) return toggleStyle(styles, style.link("http://foobar"))
  return toggleStyle(styles, style.code)
}

function randomText(maxLen) {
  return text(Math.ceil(Math.random() * maxLen))
}
