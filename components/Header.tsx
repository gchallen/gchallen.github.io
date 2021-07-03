import { Cross as Hamburger } from "hamburger-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import Sidebar from "react-sidebar"
import ChooseDarkMode from "../components/ChooseDarkMode"

const SidebarContent: React.FC = () => {
  return (
    <div id="sidebarcontent" style={{ height: "100%" }}>
      <div>
        <h2>
          <Link href="/">
            <a>Home</a>
          </Link>
        </h2>
        <h2>
          <Link href="/about/">
            <a>About</a>
          </Link>
        </h2>
        <h2>
          <Link href="/essays/">
            <a>Essays</a>
          </Link>
        </h2>
      </div>
      <div>
        <h2>
          <ChooseDarkMode text />
        </h2>
        <hr />
        <h2>
          <Link href="/rss.xml">
            <a>RSS</a>
          </Link>
        </h2>
        <h2>
          <Link href="/atom.xml">
            <a>Atom</a>
          </Link>
        </h2>
        <h2>
          <Link href="/feed.json">
            <a>JSON</a>
          </Link>
        </h2>
      </div>
    </div>
  )
}

const Header: React.FC = () => {
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <Sidebar
        styles={{
          root: { position: undefined },
          content: {
            position: undefined,
            top: undefined,
            left: undefined,
            right: undefined,
            bottom: undefined,
          },
          sidebar: { position: "fixed", top: "0", left: "0", bottom: "0" },
        }}
        sidebar={<SidebarContent />}
        open={isOpen}
        onSetOpen={setOpen}
      >
        <div></div>
      </Sidebar>
      <header>
        <div className="container">
          <div className="box">
            <Link href="/">
              <a>
                <Image
                  priority
                  src="/cartoon-light.png"
                  alt="Geoffrey Challen"
                  width={46}
                  height={63}
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              </a>
            </Link>
          </div>
          <div className="box" style={{ justifyContent: "center", fontSize: "1.1em" }}>
            <Link href="/" passHref>
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "right",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ borderRight: "1px solid #bbbbbb", paddingRight: 5 }}>
                    <div>
                      <strong>Geoffrey</strong>
                    </div>
                    <div>
                      <strong>Teaching</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", paddingLeft: 6, justifyContent: "center" }}>
                  <div>Challen</div>
                  <div>Professor</div>
                </div>
              </div>
            </Link>
          </div>
          <div className="hamburger" style={{ justifyContent: "flex-end", alignItems: "center", paddingRight: 8 }}>
            <div style={{ zIndex: 1000 }}>
              <Hamburger toggled={isOpen} toggle={setOpen} label={"Open menu"} />
            </div>
          </div>
        </div>
        <div className="links">
          <div>
            <Link href="/essays">
              <a>Essays</a>
            </Link>
          </div>
          <div>
            <Link href="/about">
              <a>About</a>
            </Link>
          </div>
          <div>
            <Link href="#feeds">
              <a>Feeds</a>
            </Link>
          </div>
          <div>
            <ChooseDarkMode />
          </div>
        </div>
      </header>
    </>
  )
}
export default Header
