import { Cross as Hamburger } from "hamburger-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import Sidebar from "react-sidebar"
import styles from "./Header.module.scss"

const SidebarContent: React.FC = () => {
  return (
    <div id="sidebarcontent">
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
          sidebar: { position: "fixed" },
        }}
        sidebar={<SidebarContent />}
        open={isOpen}
        onSetOpen={setOpen}
      >
        <div></div>
      </Sidebar>
      <header style={{ fontFamily: "Tahoma, sans-serif" }}>
        <div className={styles.container}>
          <div className={styles.box}>
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
          <div className={styles.box} style={{ justifyContent: "center", fontSize: "1.1em" }}>
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
          <div
            className={styles.hamburger}
            style={{ justifyContent: "flex-end", alignItems: "center", paddingRight: 8 }}
          >
            <div style={{ zIndex: 1000 }}>
              <Hamburger toggled={isOpen} toggle={setOpen} label={"Open menu"} />
            </div>
          </div>
        </div>
        <div className={styles.links}>
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
        </div>
      </header>
    </>
  )
}
export default Header
