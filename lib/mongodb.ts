import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/geoffreychallen"

const client = new MongoClient(MONGODB_URI)
const _db = client.connect().then(() => client.db())

export async function getDb(): Promise<Db> {
  return _db
}

// Create indexes on startup
Promise.resolve().then(async () => {
  const db = await _db

  const col = db.collection("subscribers")
  await col.createIndex({ email: 1 }, { unique: true })
  await col.createIndex({ confirmToken: 1 }, { unique: true })
  await col.createIndex({ unsubscribeToken: 1 }, { unique: true })

  console.log("MongoDB indexes created")
})

export { client }
