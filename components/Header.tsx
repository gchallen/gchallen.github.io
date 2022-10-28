import { Cross as Hamburger } from "hamburger-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useState } from "react"
import Sidebar from "react-sidebar"
import ChooseDarkMode from "../components/ChooseDarkMode"
import LoginButton from "./LoginButton"

const SidebarLink: React.FC<{ href: string; setOpen: (open: boolean) => void }> = ({ href, setOpen, children }) => {
  const { pathname } = useRouter()
  if (href === pathname || href === `${pathname}/`) {
    return <div onClick={() => setOpen(false)}>{children}</div>
  } else {
    return <Link href={href}>{children}</Link>
  }
}

const SidebarContent: React.FC<{ setOpen: (open: boolean) => void }> = ({ setOpen }) => {
  return (
    <div id="sidebarcontent" style={{ height: "100%" }}>
      <div>
        <h2>
          <SidebarLink href="/" setOpen={setOpen}>
            Home
          </SidebarLink>
        </h2>
        <h2>
          <SidebarLink href="/about/" setOpen={setOpen}>
            About
          </SidebarLink>
        </h2>
        <h2>
          <SidebarLink href="/essays/" setOpen={setOpen}>
            Essays
          </SidebarLink>
        </h2>
        <h2>
          <SidebarLink href="/CV/" setOpen={setOpen}>
            Curriculum Vitæ
          </SidebarLink>
        </h2>
      </div>
      <div>
        <h2>
          <LoginButton text />
        </h2>
        <h2>
          <ChooseDarkMode text />
        </h2>
        <hr />
        <h2>
          <Link href="mailto:geoffrey.challen@gmail.com">Contact</Link>
        </h2>
        <h2>
          <Link href="/rss.xml">RSS</Link>
        </h2>
        <h2>
          <Link href="/atom.xml">Atom</Link>
        </h2>
        <h2>
          <Link href="/feed.json">JSON</Link>
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
        sidebarClassName="sidebarsidebar"
        styles={{
          root: { position: undefined },
          content: {
            position: undefined,
            top: undefined,
            left: undefined,
            right: undefined,
            bottom: undefined,
          },
        }}
        sidebar={<SidebarContent setOpen={setOpen} />}
        open={isOpen}
        onSetOpen={setOpen}
      >
        <div></div>
      </Sidebar>
      <header>
        <div className="container">
          <div className="box">
            <Link href="/">
              <Image
                priority
                src="/cartoon-75x102.png"
                alt="Geoffrey Challen"
                width={46}
                height={63}
                unoptimized={process.env.NODE_ENV === "development"}
              />
            </Link>
          </div>
          <div className="box" style={{ justifyContent: "center", fontSize: "1.1em" }}>
            <Link href="/" passHref>
              <div style={{ display: "flex", height: "100%" }}>
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
            <Link href="/essays">Essays</Link>
          </div>
          <div>
            <Link href="/about">About</Link>
          </div>
          <div>
            <Link href="/CV">CV</Link>
          </div>
          <div>
            <Link href="#feeds">Feeds</Link>
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
