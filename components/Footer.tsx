import Link from "next/link"
import LoginButton from "./LoginButton"

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <Link href="/">Home</Link>
        <Link href="/statements">Statements</Link>
        <Link href="mailto:geoffrey.challen@gmail.com">Contact</Link>
        <LoginButton text />
        {process.env.NEXT_PUBLIC_SHOW_OPENING && <Link href="/opening">Recruiting</Link>}
        <Link href="https://learncs.online" target="_blank">
          <kbd>learncs.online</kbd>
        </Link>
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
