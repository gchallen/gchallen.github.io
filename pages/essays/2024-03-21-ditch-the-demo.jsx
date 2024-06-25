import Content from "../../output/essays/21-ditch-the-demo"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/21-ditch-the-demo.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
