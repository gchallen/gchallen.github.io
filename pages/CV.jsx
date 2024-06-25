import Content from "../output/CV"
import components from "../layouts/Layout"
import frontmatter from "../output/CV.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
