import "ace-builds/src-noconflict/ace"
import aceHighlighter from "ace-builds/src-noconflict/ext-static_highlight"
import { Mode as Java } from "ace-builds/src-noconflict/mode-java"
import { Mode as Kotlin } from "ace-builds/src-noconflict/mode-kotlin"
import { Mode as Python } from "ace-builds/src-noconflict/mode-python"
import { Mode as Sh } from "ace-builds/src-noconflict/mode-sh"
import assert from "assert"
import _sizeOf from "image-size"
import type { Data } from "mdast"
import { toString } from "mdast-util-to-string"
import path from "path"
import slugify from "slugify"
import stringHash from "string-hash"
import type { Node, Parent } from "unist"
import { visit } from "unist-util-visit"
import { promisify } from "util"

const sizeOf = promisify(_sizeOf)

const redirects = ["/scholar", "/statements/teaching", "/statements/service", "/statements/scholarly"]

type OurNode = Node & { url?: string; value?: string; children?: OurNode[] }

export function links() {
  function transformer(tree: Node) {
    visit(tree, "link", visitor)
    function visitor(node: OurNode) {
      assert(node.url)
      const data: Data = node.data || (node.data = {})
      const props = data.hProperties || (data.hProperties = {})
      if (node.url !== "+" && node.url.startsWith("+")) {
        node.url = node.url.replace(/^\+/, "")
        props.target = "_blank"
        props.rel = "noopener"
      } else if (node.url !== "~" && node.url.startsWith("~")) {
        node.url = node.url.replace(/^\~/, "")
        props.target = "_blank"
        props.rel = "noopener"
      } else if (
        redirects.includes(node.url) ||
        node.url.startsWith("http://") ||
        node.url.startsWith("https://") ||
        node.url.startsWith("//")
      ) {
        props.target = "_blank"
        props.rel = "noopener"
      }
    }
  }
  return transformer
}

export function pullquotes() {
  function transformer(tree: Node) {
    visit(tree, "paragraph", visitor)
    function visitor(node: OurNode) {
      let children: Node[] = []
      let sawQuote
      for (const child of node.children as (Parent & { url: string })[]) {
        if (child.type === "link" && child.url === "+") {
          if (sawQuote) {
            throw Error("Can't have more than one pullquote in a paragraph")
          }
          children = [...children, ...child.children]
          sawQuote = [...child.children]
        } else {
          children.push(child)
        }
      }
      if (sawQuote) {
        const newNode = {
          type: "parent",
          children: [
            {
              type: "div",
              children: sawQuote,
              data: {
                hProperties: { className: "pullquote" },
              },
            },
            {
              type: "paragraph",
              children,
            },
          ],
        }
        Object.assign(node, newNode)
      }
    }
  }
  return transformer
}

export function comments() {
  function transformer(tree: Node) {
    visit(tree, "paragraph", visitor)
    function visitor(node: OurNode) {
      const children = []
      for (const child of node.children as OurNode[]) {
        if (child.type === "text") {
          assert(child.value)
          children.push({
            type: "text",
            value: child.value
              .split("\n")
              .filter((line: string) => !line.startsWith("//"))
              .join("\n"),
          })
        } else {
          children.push(child)
        }
      }
      Object.assign(node, {
        type: "paragraph",
        children: [...children],
      })
    }
  }
  return transformer
}

export function headings() {
  const duplicates: { [key: string]: boolean } = {}
  function transformer(tree: Node) {
    visit(tree, "heading", visitor)

    function visitor(node: OurNode) {
      assert(node.children)
      const headerAsString = toString(node)
      let id = slugify(headerAsString.toLowerCase())
      const match = /^(.*?)\s*\(\(([\w-]+)\)\)$/.exec(headerAsString)
      if (match && match[1]) {
        id = match[2]
        node.children = [{ type: "text", value: match[1] }]
      }
      const originalChildren = [...node.children]
      if (id in duplicates) {
        throw `Duplicate heading ${id}`
      }
      duplicates[id] = true

      node.children = [
        { type: "link", url: "#", data: { hProperties: { className: "anchorTarget", id } } },
        {
          type: "link",
          url: `#${id}`,
          data: {
            hProperties: { className: "anchor screenonly" },
          },
          children: originalChildren,
        },
        {
          type: "div",
          data: {
            hProperties: { className: "printonly" },
          },
          children: originalChildren,
        },
      ]
    }
  }
  return transformer
}

const modes: { [key: string]: any } = {
  java: Java,
  kotlin: Kotlin,
  python: Python,
  sh: Sh,
}

function highlight(content: string, opts: any) {
  const Mode = opts.mode ? modes[opts.mode as string] : undefined
  if (opts.mode && opts.mode !== "text" && !Mode) {
    throw Error(`Unloaded mode: ${opts.mode}`)
  }
  const { html, css } = aceHighlighter.renderSync(content, Mode && new Mode(), {})
  return { html, css }
}

export function highlighter() {
  let counters: { [key: string]: number } = {}

  function transformer(tree: Node) {
    visit(tree, "code", visitor)

    function visitor(node: OurNode & { lang?: string; meta?: any }) {
      assert(node.value)
      const { html, css } = highlight(node.value, { mode: node.lang, theme: "twilight" })
      let id = stringHash(node.value).toString()
      if (counters[id] !== undefined) {
        counters[id]++
        id += `-${counters[id]}`
      } else {
        counters[id] = 0
      }
      const newNode = {
        type: "mdxJsxFlowElement",
        name: "Code",
        children: [
          {
            type: "text",
            value: html,
          },
        ],
        attributes: [
          { name: "mode", type: "mdxJsxAttribute", value: node.lang },
          {
            name: "originalCode",
            type: "mdxJsxAttribute",
            value: Buffer.from(node.value).toString("base64"),
          },
          {
            name: "codeId",
            type: "mdxJsxAttribute",
            value: id,
          },
        ],
      }
      if (node.meta) {
        newNode.attributes.push({
          name: "meta",
          type: "mdxJsxAttribute",
          value: node.meta,
        })
      }
      Object.assign(node, newNode)
    }
  }
  return transformer
}

export function fixfootnotes() {
  let counter = 0

  function transformer(tree: Node) {
    visit(tree, "footnote", visitor)

    function visitor(node: OurNode) {
      counter++
      const newNode = {
        type: "mdxJsxFlowElement",
        name: "Footnote",
        children: node.children,
        attributes: [{ name: "counter", type: "mdxJsxAttribute", value: counter }],
      }
      Object.assign(node, newNode)
    }
  }
  return transformer
}

export function fiximages(options: { url: string }) {
  async function transformer(tree: Node) {
    const promises: Promise<unknown>[] = []
    visit(tree, "paragraph", visitor)
    await Promise.all(promises)

    function visitor(parent: OurNode) {
      assert(parent.children)
      if (parent.children.length < 1 || parent.children[0].type !== "image") {
        return
      }
      const node = parent.children[0] as OurNode & { alt: unknown }
      assert(node.url)
      const url = node.url.startsWith("~") ? path.join(options.url, node.url.replace("~", "")) : node.url
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        return
      }
      const promise = sizeOf(path.join("public", url))
        .then((dimensions) => {
          assert(dimensions)
          assert(parent.children)
          const newNode = {
            type: "mdxJsxFlowElement",
            name: "Image",
            attributes: [
              { name: "src", type: "mdxJsxAttribute", value: `/${url}` },
              { name: "width", type: "mdxJsxAttribute", value: dimensions.width },
              { name: "height", type: "mdxJsxAttribute", value: dimensions.height },
              { name: "alt", type: "mdxJsxAttribute", value: node.alt },
            ],
            children: [...parent.children.slice(1)],
          }
          Object.assign(parent, newNode)
        })
        .catch((_err) => {})
      promises.push(promise)
    }
  }
  return transformer
}
