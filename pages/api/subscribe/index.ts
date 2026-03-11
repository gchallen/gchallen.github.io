import crypto from "crypto"
import validator from "email-validator"
import type { NextApiRequest, NextApiResponse } from "next"
import { sendConfirmationEmail } from "../../../lib/email"
import { getDb } from "../../../lib/mongodb"

const rateLimit = new Map<string, number>()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email } = req.body
  if (!email || !validator.validate(email)) {
    return res.status(400).json({ error: "Invalid email address" })
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown"
  const now = Date.now()
  const lastRequest = rateLimit.get(ip)
  if (lastRequest && now - lastRequest < 10_000) {
    return res.status(429).json({ error: "Too many requests. Please try again shortly." })
  }
  rateLimit.set(ip, now)

  const confirmToken = crypto.randomUUID()
  const unsubscribeToken = crypto.randomUUID()

  const db = await getDb()
  await db.collection("subscribers").updateOne(
    { email },
    {
      $set: { email, confirmToken, unsubscribeToken },
      $setOnInsert: { confirmed: false, createdAt: new Date() },
    },
    { upsert: true },
  )

  await sendConfirmationEmail(email, confirmToken)

  return res.status(200).json({ message: "Check your email for a confirmation link" })
}
