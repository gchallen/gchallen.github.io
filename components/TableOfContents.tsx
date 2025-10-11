import { useEffect, useState } from "react"

export interface TocHeading {
  text: string
  id: string
  depth: number
  children?: TocHeading[]
}

interface TableOfContentsProps {
  headings: TocHeading[]
}

const TocItem: React.FC<{
  heading: TocHeading
  activeId: string | null
  onSetActive: (id: string) => void
}> = ({ heading, activeId, onSetActive }) => {
  const hasChildren = heading.children && heading.children.length > 0

  const isActive = activeId === heading.id
  const hasActiveChild = heading.children?.some((child) => child.id === activeId)

  // Show children if this section or any child is active
  const showChildren = hasChildren && (isActive || hasActiveChild)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (heading.id === "top") {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "instant" })
      window.location.hash = ""
      onSetActive(heading.id)
    } else {
      window.location.hash = heading.id
      // Update active immediately after click
      onSetActive(heading.id)
    }
  }

  return (
    <li>
      <a
        href={`#${heading.id}`}
        onClick={handleClick}
        className={isActive ? "active" : ""}
        style={{ fontWeight: isActive ? "bold" : "normal" }}
      >
        {heading.text}
      </a>
      {showChildren && (
        <ul className="tocNested">
          {heading.children!.map((child) => (
            <TocItem key={child.id} heading={child} activeId={activeId} onSetActive={onSetActive} />
          ))}
        </ul>
      )}
    </li>
  )
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    // Collect all heading IDs
    const headingIds: string[] = []
    const collectIds = (items: TocHeading[]) => {
      items.forEach((item) => {
        headingIds.push(item.id)
        if (item.children) {
          collectIds(item.children)
        }
      })
    }
    collectIds(headings)

    const HEADER_HEIGHT = 70 // Account for fixed header

    const updateActiveHeading = () => {
      // Find all heading elements
      const elements = headingIds
        .map((id) => {
          if (id === "top") {
            const h1 = document.querySelector("main h1")
            return { id, element: h1 }
          } else {
            const anchor = document.querySelector(`a.anchorTarget[id="${id}"]`)
            return { id, element: anchor }
          }
        })
        .filter(({ element }) => element !== null)

      // Find which heading is closest to the top threshold
      let closestId: string | null = null
      let closestDistance = Infinity

      for (const { id, element } of elements) {
        const rect = element!.getBoundingClientRect()
        const distance = Math.abs(rect.top - HEADER_HEIGHT)

        // Prefer headings that are at or just below the threshold
        if (rect.top <= HEADER_HEIGHT + 50 && distance < closestDistance) {
          closestDistance = distance
          closestId = id
        }
      }

      if (closestId) {
        setActiveId(closestId)
      }
    }

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout | null = null
    const handleScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        updateActiveHeading()
        scrollTimeout = null
      }, 100)
    }

    // Initial update
    updateActiveHeading()

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [headings])

  if (!headings || headings.length === 0) {
    return null
  }

  return (
    <nav className="tableOfContents">
      <ul className="tocList">
        {headings.map((heading) => (
          <TocItem key={heading.id} heading={heading} activeId={activeId} onSetActive={setActiveId} />
        ))}
      </ul>
    </nav>
  )
}

export default TableOfContents
