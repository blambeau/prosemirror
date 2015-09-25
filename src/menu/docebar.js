import {defineOption} from "../edit"
import {elt} from "../dom"
import {Debounced} from "../util/debounce"

import {Menu} from "./menu"
import {getItems, separatorItem} from "./items"

defineOption("doceBar", false, function(pm, value) {
  if (pm.mod.menuBar) pm.mod.menuBar.detach()
  pm.mod.menuBar = value ? new DoceBar(pm, value) : null
})

class BarDisplay {
  constructor(container, resetFunc) {
    this.container = container
    this.resetFunc = resetFunc
  }
  clear() { this.container.textContent = "" }
  reset() { this.resetFunc() }
  show(dom) {
    this.clear()
    this.container.appendChild(dom)
  }
  enter(dom, back) {
    let current = this.container.firstChild
    if (current) {
      current.style.display = "none"
    }
    let backButton = elt("div", {class: "ProseMirror-menubar-back"})
    backButton.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation()
      back()
    })
    let added = elt("div", {class: "ProseMirror-menubar-sliding"}, backButton, dom)
    this.container.appendChild(added)
  }
}

class DoceBar {
  constructor(pm, config) {
    this.pm = pm

    this.menuElt = elt("div", {class: "ProseMirror-menubar-inner"})
    this.wrapper = elt("div", {class: "ProseMirror-menubar"}, this.menuElt)
    pm.wrapper.insertBefore(this.wrapper, pm.wrapper.firstChild)

    this.menu = new Menu(pm, new BarDisplay(this.menuElt, () => this.resetMenu()))
    this.debounced = new Debounced(pm, 100, () => this.update())

    pm.on("selectionChange", this.updateFunc = () => this.debounced.trigger())
    pm.on("change", this.updateFunc)
    pm.on("activeStyleChange", this.updateFunc)

    this.menuItems = config && config.items ||
      [...getItems("inline"), separatorItem, ...getItems("block"), separatorItem, ...getItems("list"), ...getItems("history")]
    this.update()
  }

  detach() {
    this.debounced.clear()
    this.wrapper.parentNode.removeChild(this.wrapper)

    this.pm.off("selectionChange", this.updateFunc)
    this.pm.off("change", this.updateFunc)
    this.pm.off("activeStyleChange", this.updateFunc)
  }

  update() {
    if (!this.menu.active) this.resetMenu()
  }

  resetMenu() {
    this.menu.show(this.menuItems)
  }
}
