import { ArgumentParser } from "argparse"
import { readFile, writeFile } from "fs/promises"
import { glob } from "glob"
import matter from "gray-matter"
import readline from "readline"
import { buildNotificationEmail, sendNotificationEmail } from "../lib/email"
import { getEssays } from "../lib/getEssays"
import { getDb } from "../lib/mongodb"

const parser = new ArgumentParser({ description: "Send notification emails for new essays" })
parser.add_argument("--dry-run", { action: "store_true", help: "Print email content instead of sending" })
parser.add_argument("--all", { action: "store_true", help: "Include already-notified essays" })
parser.add_argument("--remote", { action: "store_true", help: "Send notifications via production API route" })
parser.add_argument("--site-url", { help: "Override SITE_URL (default: env var)", default: undefined })
parser.add_argument("--notify-secret", { help: "Override NOTIFY_SECRET (default: env var)", default: undefined })

const args = parser.parse_args()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function findMdxFile(essayUrl: string): Promise<string | null> {
  const slug = essayUrl.replace("essays/", "").replace(/^\d{4}-\d{2}-\d{2}-/, "")
  const files = await glob("mdx/essays/**/*.mdx")
  for (const file of files) {
    const essayData = await import(`../output/${file.replace("mdx/", "").replace(".mdx", ".json")}`, {
      assert: { type: "json" },
    }).catch(() => null)
    if (essayData?.default?.url === essayUrl) {
      return file
    }
  }
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

function email(doc: any): string {
  return doc.email as string
}

async function handleDryRun(essays: { title: string; description: string; url: string }[]) {
  for (const essay of essays) {
    const { subject, html, text } = buildNotificationEmail(essay, "PLACEHOLDER_UNSUBSCRIBE_TOKEN")
    console.log("=".repeat(60))
    console.log(`Essay: ${essay.title}`)
    console.log(`Subject: ${subject}`)
    console.log("-".repeat(60))
    console.log("HTML:")
    console.log(html)
    console.log("-".repeat(60))
    console.log("Text:")
    console.log(text)
    console.log("=".repeat(60))
    console.log()
  }
}

async function handleRemote(
  essays: { title: string; description: string; url: string }[],
  siteUrl: string,
  notifySecret: string,
) {
  for (const essay of essays) {
    const answer = await ask(`Send notification for "${essay.title}"? (y/n/skip-permanently) `)

    if (answer === "y") {
      console.log(`  Sending via ${siteUrl}/api/notify...`)
      const res = await fetch(`${siteUrl}/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${notifySecret}`,
        },
        body: JSON.stringify({ title: essay.title, description: essay.description, url: essay.url }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`  Error: ${data.error}`)
        continue
      }
      console.log(`  Sent to ${data.sent} subscriber(s).`)

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
}

async function handleLocal(essays: { title: string; description: string; url: string }[]) {
  for (const essay of essays) {
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
}

async function main() {
  const { published } = await getEssays()
  const essays = args.all ? published : published.filter((e) => !e.notified)

  if (essays.length === 0) {
    console.log(args.all ? "No published essays found." : "All published essays have been notified about.")
    rl.close()
    process.exit(0)
  }

  console.log(`Found ${essays.length} essay(s)${args.all ? " (including already-notified)" : " un-notified"}:\n`)
  for (const e of essays) {
    console.log(`  - ${e.title}${e.notified ? " [notified]" : ""}`)
  }
  console.log()

  if (args.dry_run) {
    await handleDryRun(essays)
  } else if (args.remote) {
    const siteUrl = args.site_url || process.env.SITE_URL
    const notifySecret = args.notify_secret || process.env.NOTIFY_SECRET
    if (!siteUrl) {
      console.error("Error: SITE_URL not set. Use --site-url or set SITE_URL env var.")
      process.exit(1)
    }
    if (!notifySecret) {
      console.error("Error: NOTIFY_SECRET not set. Use --notify-secret or set NOTIFY_SECRET env var.")
      process.exit(1)
    }
    await handleRemote(essays, siteUrl, notifySecret)
  } else {
    await handleLocal(essays)
  }

  rl.close()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
