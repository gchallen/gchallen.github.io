import { visit } from "unist-util-visit"
import slugify from "slugify"
import { toString } from "mdast-util-to-string"
import { highlight } from "./highlight.js"
import path from "path"
import { promisify } from "util"
import _sizeOf from "image-size"
const sizeOf = promisify(_sizeOf)

export function links() {
  function transformer(ast) {
    visit(ast, "link", visitor)
    function visitor(node) {
      const data = node.data || (node.data = {})
      const props = data.hProperties || (data.hProperties = {})
      const url = node.url
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
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

export function headings() {
  function transformer(ast) {
    visit(ast, "heading", visitor)

    function visitor(node) {
      const data = node.data || (node.data = {})
      const props = data.hProperties || (data.hProperties = {})
      const slugId = slugify(toString(node).toLowerCase())

      //data.id = slugId
      //props.id = slugId

      const originalChildren = [...node.children]

      node.children = [
        { type: "link", url: "", data: { hProperties: { className: "anchorTarget", id: slugId } } },
        {
          type: "link",
          url: `#${slugId}`,
          data: {
            hProperties: { className: "anchor" },
          },
          children: originalChildren,
        },
      ]
    }
  }
  return transformer
}

export function highlighter() {
  function transformer(ast) {
    visit(ast, "code", visitor)

    function visitor(node) {
      const { html, css } = highlight(node.value, { mode: node.lang, theme: "twilight" })
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
        ],
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
        .catch((err) => {})
      promises.push(promise)
    }
  }
  return transformer
}
