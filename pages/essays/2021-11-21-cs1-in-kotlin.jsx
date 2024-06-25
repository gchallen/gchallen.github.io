import Content from "../../output/essays/11-cs1-in-kotlin/index"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/11-cs1-in-kotlin/index.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
