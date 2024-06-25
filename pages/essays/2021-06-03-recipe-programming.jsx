import Content from "../../output/essays/01-recipe-programming/index"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/01-recipe-programming/index.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
