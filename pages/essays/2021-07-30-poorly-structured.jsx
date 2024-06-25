import Content from "../../output/essays/09-poorly-structured"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/09-poorly-structured.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
