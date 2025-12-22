import { compile, evaluateSync } from "@mdx-js/mdx"
import { ArgumentParser } from "argparse"
import { exec } from "child-process-promise"
import chokidar from "chokidar"
import { copy, emptyDir, mkdirs, remove } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { glob } from "glob"
import matter from "gray-matter"
import moment from "moment"
import path from "path"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import * as runtime from "react/jsx-runtime"
import readingTime from "reading-time"
import rehypeKate from "rehype-katex"
import footnotes from "remark-footnotes"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import smartypants from "remark-smartypants"
import replaceExt from "replace-ext"
import slugify from "slugify"
import { comments, extractToc, fixfootnotes, fiximages, headings, highlighter, links, pullquotes } from "./plugins"

const parser = new ArgumentParser()
parser.add_argument("input")
parser.add_argument("output")
parser.add_argument("--build", { default: false, action: "store_true" })
parser.add_argument("--clean", { default: false, action: "store_true" })
parser.add_argument("--defaultLayout", { default: "Layout" })
const args = parser.parse_args()

async function update(source: string) {
  const { content, data, isEmpty } = matter(await readFile(source))

  let pagePath

  if (source.startsWith("mdx/essays/")) {
    data.isEssay = true
    const prefix = data.published ? `${moment(data.published).utc().format("YYYY-MM-DD")}-` : ""
    const postfix = data.draft ? "-draft" : ""
    const name = `${prefix}${slugify(data.title, { lower: true })}${postfix}.jsx`
    pagePath = path.join("pages/essays", name)
  } else if (source.startsWith("mdx/talks/")) {
    data.isTalk = true
    const prefix = data.published ? `${moment(data.published).utc().format("YYYY-MM-DD")}-` : ""
    const name = `${prefix}${slugify(data.title, { lower: true })}.jsx`
    pagePath = path.join("pages/talks", name)
    // Derive slides URL from directory name by convention (talks use index.mdx in directories)
    const talkDir = source.endsWith("/index.mdx") ? path.basename(path.dirname(source)) : path.basename(source, ".mdx")
    data.slidesUrl = `/talks/${talkDir}/slides.html`
  } else {
    pagePath = replaceExt(path.join("pages", path.relative(args.input, source)), ".jsx")
  }

  const url = replaceExt(pagePath.replace("pages/", ""), "")
  if (source.endsWith("/index.mdx")) {
    const otherFiles = (await glob(path.join(path.dirname(source), "*"))).filter((p) => p !== source)
    // For talks, copy to public/talks/{talkDir}/, otherwise public/mdx/{url}/
    const publicDir = data.isTalk
      ? path.join("public/talks", path.basename(path.dirname(source)))
      : path.join("public/mdx", url)
    await mkdirs(publicDir)
    for (const otherFile of otherFiles) {
      await copy(otherFile, path.join(publicDir, path.basename(otherFile)))
    }
  }
  const reading = readingTime(content)
  const compiled = await compile(content, {
    rehypePlugins: [rehypeKate],
    remarkPlugins: [
      comments,
      [footnotes as any, { inlineNotes: true }],
      links,
      extractToc,
      headings,
      pullquotes,
      fixfootnotes,
      smartypants,
      highlighter,
      remarkGfm,
      [fiximages, { url: path.join("mdx", url) }],
      remarkMath,
    ],
  })
  const toc = (compiled.data as any)?.toc || []
  const contents = compiled.toString()

  // Generate HTML for RAG
  try {
    // Simple fallback components for HTML generation
    const htmlComponents = {
      Image: ({ src, alt, width, height, children }: any) =>
        createElement(
          "figure",
          null,
          createElement("img", { src, alt, width, height, style: { height: "auto" } }),
          children && createElement("figcaption", null, children),
        ),
      Code: ({ children }: any) => createElement("pre", null, createElement("code", null, children)),
      YouTube: ({ id }: any) => createElement("div", { className: "youtube-placeholder" }, `[YouTube Video: ${id}]`),
      Footnote: ({ counter, children }: any) =>
        createElement("sup", { className: "footnote" }, `(${counter}: ${children})`),
      ScreenOnly: ({ children }: any) => createElement("div", { className: "screenonly" }, children),
      PrintOnly: ({ children }: any) => createElement("div", { className: "printonly" }, children),
      Comment: () => null,
      a: ({ href, children, ...props }: any) => {
        if (href === "-") {
          return createElement("span", null, children)
        }
        return createElement("a", { href, ...props }, children)
      },
    }

    const mdxModule = evaluateSync(content, {
      ...(runtime as any),
      remarkPlugins: [remarkGfm, [footnotes as any, { inlineNotes: true }], remarkMath, smartypants],
      rehypePlugins: [rehypeKate],
    })

    const htmlContent = renderToString(createElement(mdxModule.default as any, { components: htmlComponents }))

    // Create HTML file path in rag/html directory
    const htmlPath = replaceExt(path.resolve("rag/html", path.relative(args.input, source)), ".html")
    await mkdirs(path.dirname(htmlPath))

    // Write HTML with metadata
    const htmlWithMetadata = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="source" content="${source}">
  <meta name="title" content="${data.title || ""}">
  <meta name="description" content="${data.description || ""}">
  <meta name="url" content="${url}">
  ${data.published ? `<meta name="published" content="${data.published}">` : ""}
  ${data.draft ? `<meta name="draft" content="true">` : ""}
</head>
<body>
  ${htmlContent}
</body>
</html>`

    await writeFile(htmlPath, htmlWithMetadata)
  } catch (error) {
    console.error(`Failed to generate HTML for ${source}:`, error)
  }

  const contentPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".js")
  const dataPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".json")
  const frontmatterString = Object.keys(data)
    .map((name) => {
      return `const ${name} = ${JSON.stringify(data[name])};`
    })
    .join("\n")
  const lines = contents.split("\n")
  const splitPoint = lines.slice(1).findIndex((line) => !line.trim().startsWith("import"))
  const templated = `${lines.slice(0, splitPoint + 1).join("\n")}
${frontmatterString}
${lines.slice(splitPoint + 1).join("\n")}`.trim()
  await mkdirs(path.dirname(contentPath))
  await writeFile(contentPath, templated)

  await mkdirs(path.dirname(dataPath))
  const publishedAt = data.published ? moment(data.published).utc().format("YYYY-MM-DD") : undefined
  await writeFile(
    dataPath,
    JSON.stringify(
      !isEmpty ? { ...data, url, reading, publishedAt, toc } : { url, reading, publishedAt, toc },
      null,
      2,
    ),
  )

  const contentImportPath = replaceExt(path.relative(path.dirname(pagePath), contentPath), "")
  const layoutImportPath = path.relative(
    path.dirname(pagePath),
    path.join("layouts", data.layout ?? args.defaultLayout),
  )
  const frontmatterImportPath = path.relative(path.dirname(pagePath), dataPath)
  const pageContent = `
import Content from "${contentImportPath}"
import components from "${layoutImportPath}"
import frontmatter from "${frontmatterImportPath}"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
`.trimStart()
  await mkdirs(path.dirname(pagePath))
  await writeFile(pagePath, pageContent)
}

async function rm(source: string) {
  const contentPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".js")
  const dataPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".json")
  const pagePath = replaceExt(path.resolve("pages", path.relative(args.input, source)), ".jsx")
  const htmlPath = replaceExt(path.resolve("rag/html", path.relative(args.input, source)), ".html")
  await remove(contentPath)
  await remove(dataPath)
  await remove(pagePath)
  await remove(htmlPath)
}

async function clean() {
  await emptyDir(args.output)
  await emptyDir("rag/html")
  try {
    await exec("git clean pages -fX")
  } catch (err) {}
}

Promise.resolve().then(async () => {
  args.clean && (await clean())
  if (!args.build) {
    chokidar
      .watch(args.input)
      .on("add", async (changedPath) => {
        changedPath.endsWith(".mdx") && (await update(changedPath))
      })
      .on("change", async (changedPath) => {
        changedPath.endsWith(".mdx") && (await update(changedPath))
      })
      .on("unlink", async (changedPath) => {
        changedPath.endsWith("mdx") && (await rm(changedPath))
      })
  } else {
    const files = await glob(path.join(args.input, "**/*.mdx"))
    for (const file of files) {
      await update(file)
    }
  }
})
