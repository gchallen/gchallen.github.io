import Content from "../output/bio"
import components from "../layouts/Layout"
import frontmatter from "../output/bio.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
