import Content from "../../output/essays/13-my-cs1-backend/index"
import components from "../../layouts/Layout"
import frontmatter from "../../output/essays/13-my-cs1-backend/index.json"

export default function Page() {
  return <Content components={components} frontmatter={frontmatter} />
}
