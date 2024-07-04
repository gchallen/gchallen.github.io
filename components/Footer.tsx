import Link from "next/link"
import LoginButton from "./LoginButton"

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/CV">CV</Link>
        <Link href="https://learncs.online" target="_blank">
          <kbd>learncs.online</kbd>
        </Link>
        <Link href="/essays">Essays</Link>
        <Link href="mailto:geoffrey.challen@gmail.com">Contact</Link>
      </div>
      <div>
        <Link href="/opening">Recruiting</Link>
        <Link href="/promotion">Promotional Materials</Link>
        <LoginButton text />
      </div>
      <div id="feeds">
        <Link href="/rss.xml">RSS</Link>
        <Link href="/atom.xml">Atom</Link>
        <Link href="/feed.json">JSON</Link>
      </div>
    </footer>
  )
}
export default Footer
