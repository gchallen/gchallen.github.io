import Content from "../output/opening"
import components from "../layouts/Layout"
import frontmatter from "../output/opening.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
