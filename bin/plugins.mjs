import { visit } from "unist-util-visit"
import slugify from "slugify"
import { toString } from "mdast-util-to-string"

export function links() {
  function transformer(ast) {
    visit(ast, "link", visitor)
    function visitor(node) {
      const data = node.data || (node.data = {})
      const props = data.hProperties || (data.hProperties = {})
      const url = node.url
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        console.log("Here")
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

      data.id = slugId
      props.id = slugId

      const originalChildren = [...node.children]

      node.children = [
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
