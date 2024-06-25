import Content from "../output/projects"
import components from "../layouts/Layout"
import frontmatter from "../output/projects.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
