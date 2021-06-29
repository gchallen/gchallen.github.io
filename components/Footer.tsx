import Link from "next/link"

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/about/">
          <a>About</a>
        </Link>
        <Link href="/essays/">
          <a>Essays</a>
        </Link>
      </div>
      <div id="feeds">
        <Link href="/rss.xml">
          <a>RSS</a>
        </Link>
        <Link href="/atom.xml">
          <a>Atom</a>
        </Link>
        <Link href="/feed.json">
          <a>JSON</a>
        </Link>
      </div>
    </footer>
  )
}
export default Footer
