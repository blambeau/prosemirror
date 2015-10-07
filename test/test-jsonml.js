import {doc, blockquote, pre, h1, h2, p, li, ol, ul, em, strong, code, a, a2, br, hr, tag} from "./build"
import {Failure} from "./failure"
import {defTest} from "./tests"
import {cmpNode,cmpArr} from "./cmp"

import {defaultSchema as schema} from "../src/model"
import {toJsonML} from "../src/convert/to_jsonml"
import {fromJsonML} from "../src/convert/from_jsonml"

import util from 'util'

function tfrom(name, doc, dom) {
  defTest("jsonml_from_" + name, () => {
    cmpNode(doc, fromJsonML(schema, dom))
  })
}

function t(name, doc, dom) {
  defTest("jsonml_" + name, () => {
    let toml = toJsonML(doc)
    cmpArr(dom, toml, "\n" + util.inspect(dom, false, null) + "\nvs.\n" + util.inspect(toml, false, null))
    let fromml = fromJsonML(schema, toml)
    cmpNode(doc, fromml)
  })
}

// let adoc = doc(p("hi", tag("docemate"), "!"))
// console.log(util.inspect(adoc, false, null))

t("empty",
  doc(p("")),
  ["article", ["p"]])

t("simple",
  doc(p("hello")),
  ["article",["p", "hello"]])

t("br",
  doc(p("hi", br, "there")),
  ["article",["p","hi",["br"],"there"]])

t("em",
  doc(p("hi", em("there"), "!")),
  ["article",["p","hi",["em","there"],"!"]])

t("multi_style",
  doc(p("hi", em("there"), strong("!"))),
  ["article",["p","hi",["em","there"],["strong", "!"]]])

t("join_styles",
  doc(p("one", strong("two", em("three")), em("four"), "five")),
  ["article",["p","one",["strong","two",["em","three"]],["em","four"],"five"]])

t("links",
  doc(p("a ", a("big ", a2("nested"), " link"))),
  ["article",["p","a ",["a",{href:"http://foo"},"big "],["a",{href:"http://bar"},"nested"],["a",{href:"http://foo"}," link"]]])

t("unordered_list",
  doc(ul(li(p("one")), li(p("two")), li(p("three", strong("!")))), p("after")),
  ["article",["ul",["li",["p","one"]],["li",["p","two"]],["li",["p","three",["strong", "!"]]]],["p", "after"]])

t("ordered_list",
  doc(ol(li(p("one")), li(p("two")), li(p("three", strong("!")))), p("after")),
  ["article",["ol",["li",["p","one"]],["li",["p","two"]],["li",["p","three",["strong", "!"]]]],["p", "after"]])

t("blockquote",
  doc(blockquote(p("hello"), p("bye"))),
  ["article",["blockquote",["p","hello"],["p", "bye"]]])

t("nested_blockquote",
  doc(blockquote(blockquote(blockquote(p("he said"))), p("i said"))),
  ["article",["blockquote",["blockquote",["blockquote",["p","he said"]]],["p","i said"]]])

t("inline_code",
  doc(p("text and ", code("code that is ", em("emphasized"), "..."))),
  ["article",["p","text and ",["code", "code that is ",["em", "emphasized"],"..."]]])

t("code_block",
  doc(blockquote(pre("some code")), p("and")),
  ["article",["blockquote",["pre","some code"]],["p","and"]])

t("headings",
  doc(h1("one"), h2("two"), p("text")),
  ["article", ["h1", "one"], ["h2", "two"], ["p", "text"]])

// t("tag",
//   doc(p("hi", tag("docemate"), "!")),
//   ["article",["p","hi",["$",{expr: "who.name"},"docemate"],"!"]])

// t("emptyTag",
//   doc(p("hi", tag("who.name"), "!")),
//   ["article",["p","hi",["$",{expr: "who.name"},"who.name"],"!"]])

//

// tfrom("tag",
//   doc(p("hi", tag("who.name"), "!")),
//   ["article",["p","hi",["$",{expr: "who.name"}],"!"]])

// tfrom("immediateTag",
//   doc(p(tag("who.name"))),
//   ["article",["$",{expr: "who.name"}]])

tfrom("span",
  doc(p("hello")),
  ["article",["p", ["span", "hello"]]])

tfrom("section",
  doc(p("hello")),
  ["article",["section", ["p", "hello"]]])
