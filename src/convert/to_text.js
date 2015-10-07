import {nodeTypes} from "../model"
import {defineTarget} from "./index"

export function toText(doc) {
  let out = ""
  function explore(node) {
    if (node.type.block) {
      let text = ""
      for (let i = 0; i < node.width; i++) {
        let child = node.child(i)
        if (child.type == nodeTypes.text)
          text += child.text
        else if (child.type == nodeTypes.hard_break)
          text += "\n"
      }
      if (text) out += (out ? "\n\n" : "") + text
    } else {
      for (let i = 0; i < node.width; i++) explore(node.child(i))
    }
  }
  explore(doc)
  return out
}

defineTarget("text", toText)
