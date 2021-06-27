import fs from "fs/promises"
import glob from "glob-promise"
import moment from "moment"
import { GetStaticProps } from "next"
import Index from "../components/Index"

export const getStaticProps: GetStaticProps = async (context) => {
  const essays = await Promise.all(
    (await glob("output/essays/*.json"))
      .map((file) => fs.readFile(file))
      .map(async (content) => JSON.parse((await content).toString()))
  ).then((essays) =>
    essays.sort(
      (b: any, a: any) => new Date(a.published ?? new Date()).valueOf() - new Date(b.published ?? new Date()).valueOf()
    )
  )

  const published = essays
    .filter((essay) => essay.published)
    .map((essay) => {
      return { ...essay, publishedAt: moment(essay.published).utc().format("YYYY-MM-DD") }
    })
  const drafts = essays.filter((essay) => essay.published === undefined)
  return { props: { published, drafts } }
}

export default Index
