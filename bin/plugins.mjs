import _sizeOf from "image-size"
import { toString } from "mdast-util-to-string"
import path from "path"
import slugify from "slugify"
import stringHash from "string-hash"
import { visit } from "unist-util-visit"
import { promisify } from "util"
import { highlight } from "./highlight.js"
const sizeOf = promisify(_sizeOf)

const redirects = ["/scholar", "/statements/teaching", "/statements/service", "/statements/scholarly"]

export function links() {
  function transformer(ast) {
    visit(ast, "link", visitor)
    function visitor(node) {
      const data = node.data || (node.data = {})
      const props = data.hProperties || (data.hProperties = {})
      const url = node.url
      if (redirects.includes(url) || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        props.target = "_blank"
        props.rel = "noopener"
      }
    }
  }
  return transformer
}

export function pullquotes() {
  function transformer(ast) {
    visit(ast, "paragraph", visitor)
    function visitor(node) {
      let children = []
      let sawQuote
      for (const child of node.children) {
        if (child.type === "link" && child.url === "+") {
          if (sawQuote) {
            throw Exception("Can't have more than one pullquote in a paragraph")
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
  function transformer(ast) {
    visit(ast, "paragraph", visitor)
    function visitor(node) {
      const children = []
      for (const child of node.children) {
        if (child.type === "text") {
          children.push({
            type: "text",
            value: child.value
              .split("\n")
              .filter((line) => !line.startsWith("//"))
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
  const duplicates = {}
  function transformer(ast) {
    visit(ast, "heading", visitor)

    function visitor(node) {
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

export function highlighter() {
  let counters = {}

  function transformer(ast) {
    visit(ast, "code", visitor)

    function visitor(node) {
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

  function transformer(ast) {
    visit(ast, "footnote", visitor)

    function visitor(node) {
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

export function fiximages(options) {
  async function transformer(ast) {
    const promises = []
    visit(ast, "paragraph", visitor)
    await Promise.all(promises)

    function visitor(parent) {
      if (parent.children.length < 1 || parent.children[0].type !== "image") {
        return
      }
      const node = parent.children[0]
      const url = node.url.startsWith("~") ? path.join(options.url, node.url.replace("~", "")) : node.url
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        return
      }
      const promise = sizeOf(path.join("public", url))
        .then((dimensions) => {
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
