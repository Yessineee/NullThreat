import { getLastVtCallAt, setLastVtCallAt } from '../storage/store.js'

// VirusTotal free tier: 4 requests/minute = 15s minimum spacing.
// We use 16s for a small safety margin.
const MIN_INTERVAL_MS = 16000

export async function canMakeVtCall() {
  const lastCall = await getLastVtCallAt()
  return Date.now() - lastCall >= MIN_INTERVAL_MS
}

export async function markVtCallMade() {
  await setLastVtCallAt(Date.now())
}