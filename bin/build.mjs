#!/usr/bin/env node

import { ArgumentParser } from "argparse"
import chokidar from "chokidar"
import path from "path"
import { compile } from "xdm"
import { readFile, writeFile } from "fs/promises"
import { mkdirs, emptyDir, remove } from "fs-extra"
import replaceExt from "replace-ext"
import glob from "glob-promise"
import matter from "gray-matter"
import { exec } from "child-process-promise"
import footnotes from "remark-footnotes"
import slugify from "slugify"
import moment from "moment"
import { links, headings, pullquotes } from "./plugins.mjs"

const parser = new ArgumentParser()
parser.add_argument("input")
parser.add_argument("output")
parser.add_argument("--build", { default: false, action: "store_true" })
parser.add_argument("--clean", { default: false, action: "store_true" })
parser.add_argument("--defaultLayout", { default: "Layout" })
const args = parser.parse_args()

const pages = {}
async function writeGitIgnore() {
  await writeFile(
    path.join("pages", ".gitignore"),
    Object.keys(pages)
      .map((page) => path.relative("pages", page))
      .join("\n")
  )
}

async function update(source) {
  const { content, data, isEmpty } = matter(await readFile(source))
  const contents = (await compile(content, { remarkPlugins: [[footnotes, { inlineNotes: true }], links, headings, pullquotes] })).toString()
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
  let pagePath
  if (source.startsWith("mdx/essays/")) {
    if (data.published || process.env.DEVELOPMENT) {
      pagePath = path.join(
        "pages/essays",
        moment(data.published ?? Date.UTC())
          .utc()
          .format("YYYY-MM-DD") +
          "-" +
          slugify(data.title, { lower: true }) +
          ".jsx"
      )
    }
  } else {
    pagePath = replaceExt(path.join("pages", path.relative(args.input, source)), ".jsx")
  }
  if (pagePath) {
    const url = replaceExt(pagePath.replace("pages/", ""), "")
    await mkdirs(path.dirname(dataPath))
    await writeFile(dataPath, JSON.stringify(!isEmpty ? { ...data, url } : { url }, null, 2))

    const contentImportPath = replaceExt(path.relative(path.dirname(pagePath), contentPath), "")
    const layoutImportPath = path.relative(
      path.dirname(pagePath),
      path.join("layouts", data.layout ?? args.defaultLayout)
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
    pages[pagePath] = true
    await writeGitIgnore()
  }
}

async function rm(source) {
  const contentPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".js")
  const dataPath = replaceExt(path.resolve(args.output, path.relative(args.input, source)), ".json")
  const pagePath = replaceExt(path.resolve("pages", path.relative(args.input, source)), ".jsx")
  await remove(contentPath)
  await remove(dataPath)
  await remove(pagePath)
  delete pages[pagePath]
  await writeGitIgnore()
}

async function clean() {
  await emptyDir(args.output)
  await exec("git clean pages -fX")
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
    await writeGitIgnore()
  }
})
