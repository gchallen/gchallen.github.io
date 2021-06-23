import Link from "next/link"
import styles from "./Header.module.scss"

const Header: React.FC = () => {
  return (
    <div id="header" style={{ fontFamily: "Tahoma, sans-serif" }}>
      <div className={styles.container}>
        <div className={styles.box}>
          <img src="/cartoon-light.png" alt="Geoffrey Challen" width={55} height={63} />
        </div>
        <div className={styles.box} style={{ justifyContent: "center", fontSize: "1.1em" }}>
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
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: 5, justifyContent: "center" }}>
            <div>Challen</div>
            <div>Professor</div>
          </div>
        </div>
        <div className={styles.box} />
      </div>
      <div
        style={{
          marginTop: -10,
          display: "flex",
          fontSize: "0.9em",
          justifyContent: "flex-end",
          alignItems: "flex-end",
        }}
      >
        <div style={{ marginRight: 10 }}>
          <Link href="/about">
            <a>About</a>
          </Link>
        </div>
      </div>
    </div>
  )
}
export default Header
