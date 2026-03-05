import Link from "next/link"

interface NavigationLink {
  title: string
  url: string
}

interface EssayNavigationData {
  previous: NavigationLink | null
  next: NavigationLink | null
  similar: NavigationLink[]
  dissimilar: NavigationLink[]
}

const EssayNavigation: React.FC<{ navigation: EssayNavigationData }> = ({ navigation }) => {
  const { previous, next, similar, dissimilar } = navigation

  return (
    <nav className="essayNavigation">
      {previous && (
        <div className="essayNavSection">
          <h4>&larr; Previous</h4>
          <Link href={previous.url}>{previous.title}</Link>
        </div>
      )}
      {next && (
        <div className="essayNavSection">
          <h4>Next &rarr;</h4>
          <Link href={next.url}>{next.title}</Link>
        </div>
      )}
      {similar.length > 0 && (
        <div className="essayNavSection">
          <h4>Similar</h4>
          <ul>
            {similar.map((link) => (
              <li key={link.url}>
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {dissimilar.length > 0 && (
        <div className="essayNavSection">
          <h4>Different</h4>
          <ul>
            {dissimilar.map((link) => (
              <li key={link.url}>
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}

export default EssayNavigation
