import Content from "../../output/test/python"
import components from "../../layouts/Layout"
import frontmatter from "../../output/test/python.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
