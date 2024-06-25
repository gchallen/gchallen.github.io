import Content from "../../output/essays/10-grade-uncertainty"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/10-grade-uncertainty.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
