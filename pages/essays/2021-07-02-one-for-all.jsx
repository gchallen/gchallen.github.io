import Content from "../../output/essays/05-one-for-all"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/05-one-for-all.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
