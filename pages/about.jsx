import Content from "../output/about"
import components from "../layouts/Layout"
import frontmatter from "../output/about.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
