import crypto from "crypto"
import validator from "email-validator"
import type { NextApiRequest, NextApiResponse } from "next"
import { sendConfirmationEmail } from "../../../lib/email"
import { getDb } from "../../../lib/mongodb"

const MAX_PER_HOUR = 3
const WINDOW_MS = 60 * 60 * 1000

const ipRequests = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const timestamps = ipRequests.get(key) || []
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)
  ipRequests.set(key, recent)
  if (recent.length >= MAX_PER_HOUR) {
    return true
  }
  recent.push(now)
  return false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email } = req.body
  if (!email || !validator.validate(email)) {
    return res.status(400).json({ error: "Invalid email address" })
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown"
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." })
  }

  const db = await getDb()

  const recentEmailCount = await db.collection("emails").countDocuments({
    recipient: email,
    type: "confirmation",
    timestamp: { $gte: new Date(Date.now() - WINDOW_MS) },
  })
  if (recentEmailCount >= MAX_PER_HOUR) {
    return res.status(429).json({ error: "Too many confirmation emails sent to this address. Please try again later." })
  }

  const confirmToken = crypto.randomUUID()
  const unsubscribeToken = crypto.randomUUID()

  await db.collection("subscribers").updateOne(
    { email },
    {
      $set: { email, confirmToken, unsubscribeToken },
      $setOnInsert: { confirmed: false, createdAt: new Date() },
    },
    { upsert: true },
  )

  await sendConfirmationEmail(email, confirmToken)

  const siteUrl = process.env.SITE_URL || "https://geoffreychallen.com"
  const confirmUrl = `${siteUrl}/api/subscribe/confirm?token=${confirmToken}`

  if (process.env.NODE_ENV !== "production") {
    return res.status(200).json({ message: "Check your email for a confirmation link", confirmUrl })
  }

  return res.status(200).json({ message: "Check your email for a confirmation link" })
}
