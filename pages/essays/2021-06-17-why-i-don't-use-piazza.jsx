import Content from "../../output/essays/03-notpiazza/index"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/03-notpiazza/index.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
