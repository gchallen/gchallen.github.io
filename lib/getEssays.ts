import fs from "fs/promises"
import { glob } from "glob"

export interface Essay {
  title: string
  description: string
  published: string
  publishedAt: string
  url: string
}
export async function getEssays(): Promise<{ published: Essay[]; drafts: Essay[] }> {
  const essays = await Promise.all(
    (await glob("output/essays/**/*.json"))
      .map((file) => fs.readFile(file))
      .map(async (content) => JSON.parse((await content).toString())),
  ).then((essays) =>
    essays.sort(
      (b: any, a: any) => new Date(a.published ?? new Date()).valueOf() - new Date(b.published ?? new Date()).valueOf(),
    ),
  )
  const published = essays.filter((essay) => essay.publishedAt)
  const drafts = essays.filter((essay) => essay.publishedAt === undefined)
  return { published, drafts }
}
