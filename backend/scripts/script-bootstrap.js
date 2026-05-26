/**
 * Load .env and use public DNS for MongoDB Atlas SRV (mongodb+srv://) resolution.
 * Must be required before mongoose.connect in any script.
 */
const dns = require('dns')
const path = require('path')

dns.setServers(['8.8.8.8', '1.1.1.1'])

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI
}

function printMongoConnectHelp(err) {
  if (err?.code !== 'ECONNREFUSED' && err?.syscall !== 'querySrv') return
  console.error('\nMongoDB SRV DNS lookup failed. Try:')
  console.error('  - Confirm internet/VPN; disable VPN or try another network')
  console.error('  - In Atlas: Network Access → allow your IP (or 0.0.0.0/0 for dev)')
  console.error('  - Use Atlas “Drivers” standard connection string (mongodb://…) instead of mongodb+srv://')
  console.error('  - Or run scripts from the same machine where `npm run dev` connects successfully\n')
}

module.exports = { getMongoUri, printMongoConnectHelp }
