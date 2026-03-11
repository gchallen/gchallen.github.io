import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "../../../lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query
  if (!token || typeof token !== "string") {
    return res.status(400).send("Invalid token")
  }

  const db = await getDb()
  const result = await db.collection("subscribers").deleteOne({ unsubscribeToken: token })

  if (result.deletedCount === 0) {
    return res.status(404).send("Token not found or already unsubscribed")
  }

  return res.redirect(302, "/unsubscribed")
}
