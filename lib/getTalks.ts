import fs from "fs/promises"
import { glob } from "glob"

export interface Talk {
  title: string
  description: string
  published: string
  publishedAt: string
  url: string
  audience: string
  slidesUrl: string
}

export async function getTalks(): Promise<Talk[]> {
  const talks = await Promise.all(
    (await glob("output/talks/**/index.json"))
      .map((file) => fs.readFile(file))
      .map(async (content) => JSON.parse((await content).toString())),
  ).then((talks) =>
    talks.sort(
      (b: any, a: any) => new Date(a.published ?? new Date()).valueOf() - new Date(b.published ?? new Date()).valueOf(),
    ),
  )
  return talks
}
