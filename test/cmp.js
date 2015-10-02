import {Failure} from "./failure"
import {style, Pos} from "../src/model"

export function cmpNode(a, b, comment) {
  function raise(msg, path) {
    throw new Failure(msg + " at " + path + "\n in " + a + "\n vs " + b + (comment ? " (" + comment + ")" : ""))
  }
  function inner(a, b, path) {
    if (a.type != b.type) raise("types differ", path)
    if (a.width != b.width) raise("different content length", path)
    for (var name in b.attrs) {
      if (!(name in a.attrs) && b.attrs[name])
        raise("missing attr " + name + " on left", path)
      if (a.attrs[name] != b.attrs[name])
        raise("attribute " + name + " mismatched -- " + a.attrs[name] + " vs " + b.attrs[name], path)
    }
    for (var name in a.attrs)
      if (!(name in b.attrs) && a.attrs[name])
        raise("missing attr " + name + " on right", path)
    if (a.type.type == "span") {
      if (a.text != b.text) raise("different text", path)
      if (!style.sameSet(a.styles, b.styles)) raise("different styles", path)
    }
    for (var i = 0; i < a.width; i++)
      inner(a.child(i), b.child(i), path + "." + i)
  }
  inner(a, b, "doc")
}

export function cmpStr(a, b, comment) {
  let as = a.toString(), bs = b.toString()
  if (as != bs)
    throw new Failure("expected " + bs + ", got " + as + (comment ? " (" + comment + ")" : ""))
}

export function cmpObj(a, b, comment) {
  if (typeof(a) !== typeof(b))
    throw new Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""))
  cmpArr(Object.keys(a), Object.keys(b), comment)
  for (let k in a) {
    cmpEql(a[k], b[k], comment)
  }
}

export function cmpArr(a, b, comment) {
  if (typeof(a) !== typeof(b))
    throw new Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""))
  if (a.length !== b.length)
    throw new Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""))
  for (let i=0; i<a.length; i++) {
    cmpEql(a[i], b[i], comment)
  }
}

export function cmp(a, b, comment) {
  if (a !== b)
    throw new Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""))
}

export function cmpEql(a, b, comment) {
  if (typeof(a) !== typeof(b))
    throw new Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""))
  if (typeof(a) === "string") {
    cmpStr(a, b, comment)
  } else if (a instanceof Array) {
    cmpArr(a, b, comment)
  } else if (typeof(a) === 'object') {
    cmpObj(a, b, comment)
  } else {
    cmp(a, b, comment)
  }
}

export function gt(a, b, comment) {
  if (a <= b)
    throw new Failure("expected " + a + " > " + b + (comment ? " (" + comment + ")" : ""))
}

export function lt(a, b, comment) {
  if (a >= b)
    throw new Failure("expected " + a + " < " + b + (comment ? " (" + comment + ")" : ""))
}

export function is(condition, comment) {
  if (!condition)
    throw new Failure("assertion failed" + (comment ? " (" + comment + ")" : ""))
}

export function P(...args) { return new Pos(args, args.pop()) }
