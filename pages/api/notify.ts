import type { NextApiRequest, NextApiResponse } from "next"
import { sendNotificationEmail } from "../../lib/email"
import { getDb } from "../../lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const secret = process.env.NOTIFY_SECRET
  if (!secret) {
    return res.status(500).json({ error: "NOTIFY_SECRET not configured" })
  }

  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { title, description, url } = req.body
  if (!title || !description || !url) {
    return res.status(400).json({ error: "Missing required fields: title, description, url" })
  }

  const db = await getDb()
  const subscribers = await db.collection("subscribers").find({ confirmed: true }).toArray()

  let sent = 0
  for (const sub of subscribers) {
    try {
      await sendNotificationEmail(sub.email as string, { title, description, url }, sub.unsubscribeToken as string)
      sent++
    } catch (err) {
      console.error(`Failed to send notification to ${sub.email}:`, err)
    }
  }

  return res.status(200).json({ sent })
}
