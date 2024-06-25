import Content from "../output/promotion"
import components from "../layouts/Layout"
import frontmatter from "../output/promotion.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
