import fs from "fs/promises"
import glob from "glob-promise"
import { GetStaticProps } from "next"
import Index from "../components/Index"

export const getStaticProps: GetStaticProps = async (context) => {
  const essays = await Promise.all(
    (await glob("output/essays/*.json"))
      .map((file) => fs.readFile(file))
      .map(async (content) => JSON.parse((await content).toString()))
  )

  return { props: {} }
}

export default Index
