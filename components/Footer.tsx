import Link from "next/link"
import LoginButton from "./LoginButton"
import SubscribeButton from "./SubscribeButton"

const Footer: React.FC = () => {
  return (
    <footer>
      <SubscribeButton />
      <div>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/about/">
          <a>About</a>
        </Link>
        <Link href="/CV/">
          <a>CV</a>
        </Link>
        <Link href="https://learncs.online">
          <a target="_blank">
            <kbd>learncs.online</kbd>
          </a>
        </Link>
        <Link href="/essays/">
          <a>Essays</a>
        </Link>
        <LoginButton text />
        <Link href="mailto:geoffrey.challen@gmail.com">
          <a>Contact</a>
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
