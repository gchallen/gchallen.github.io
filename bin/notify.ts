import { readFile, writeFile } from "fs/promises"
import { glob } from "glob"
import matter from "gray-matter"
import readline from "readline"
import { sendNotificationEmail } from "../lib/email"
import { getEssays } from "../lib/getEssays"
import { getDb } from "../lib/mongodb"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function findMdxFile(essayUrl: string): Promise<string | null> {
  const slug = essayUrl.replace("essays/", "").replace(/^\d{4}-\d{2}-\d{2}-/, "")
  const files = await glob("mdx/essays/**/*.mdx")
  for (const file of files) {
    const { data } = matter(await readFile(file))
    const essayData = await import(`../output/${file.replace("mdx/", "").replace(".mdx", ".json")}`, {
      assert: { type: "json" },
    }).catch(() => null)
    if (essayData?.default?.url === essayUrl) {
      return file
    }
  }
  // Fallback: match by slug in filename
  for (const file of files) {
    if (file.includes(slug)) {
      return file
    }
  }
  return null
}

async function setNotified(mdxPath: string): Promise<void> {
  const raw = await readFile(mdxPath, "utf-8")
  const { data, content } = matter(raw)
  data.notified = true
  const updated = matter.stringify(content, data)
  await writeFile(mdxPath, updated)
}

async function main() {
  const { published } = await getEssays()
  const unnotified = published.filter((e) => !e.notified)

  if (unnotified.length === 0) {
    console.log("All published essays have been notified about.")
    rl.close()
    process.exit(0)
  }

  console.log(`Found ${unnotified.length} un-notified essay(s):\n`)

  for (const essay of unnotified) {
    const answer = await ask(`Send notification for "${essay.title}"? (y/n/skip-permanently) `)

    if (answer === "y") {
      const db = await getDb()
      const subscribers = await db.collection("subscribers").find({ confirmed: true }).toArray()

      if (subscribers.length === 0) {
        console.log("  No confirmed subscribers. Skipping send.")
      } else {
        console.log(`  Sending to ${subscribers.length} subscriber(s)...`)
        for (const sub of subscribers) {
          try {
            await sendNotificationEmail(email(sub), essay, sub.unsubscribeToken as string)
          } catch (err) {
            console.error(`  Failed to send to ${email(sub)}:`, err)
          }
        }
        console.log("  Done sending.")
      }

      const mdxPath = await findMdxFile(essay.url)
      if (mdxPath) {
        await setNotified(mdxPath)
        console.log(`  Marked ${mdxPath} as notified.\n`)
      } else {
        console.error(`  Could not find MDX file for ${essay.url}\n`)
      }
    } else if (answer === "skip-permanently") {
      const mdxPath = await findMdxFile(essay.url)
      if (mdxPath) {
        await setNotified(mdxPath)
        console.log(`  Marked ${mdxPath} as notified (skipped).\n`)
      } else {
        console.error(`  Could not find MDX file for ${essay.url}\n`)
      }
    } else {
      console.log("  Skipped for now.\n")
    }
  }

  rl.close()
  process.exit(0)
}

function email(doc: any): string {
  return doc.email as string
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
