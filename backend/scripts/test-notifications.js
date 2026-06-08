require('dotenv').config()
const Notification = require('../models/Notification')
const connectDB = require('../config/db')

async function main() {
  await connectDB()
  const uid = '69fdcf11728a999b6c31456f'

  await Notification.deleteMany({ userId: uid, type: 'test' })
  await Notification.create({ userId: uid, type: 'test', title: 'Test 1', body: 'body1' })
  await Notification.create({ userId: uid, type: 'test', title: 'Test 2', body: 'body2' })

  const unread = await Notification.countDocuments({ userId: uid, readAt: { $exists: false } })
  console.log('unread with $exists false:', unread)

  const unreadNull = await Notification.countDocuments({ userId: uid, readAt: null })
  console.log('unread with null:', unreadNull)

  const r = await Notification.updateMany(
    { userId: uid, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  )
  console.log('updateMany matched:', r.matchedCount, 'modified:', r.modifiedCount)

  const after = await Notification.find({ userId: uid, type: 'test' }).lean()
  console.log('after:', after.map((n) => ({ title: n.title, readAt: n.readAt })))
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
