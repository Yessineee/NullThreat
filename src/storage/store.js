/* global chrome */

const HISTORY_KEY = 'scan_history'
const SETTINGS_KEY = 'settings'
const PENDING_SCANS_KEY = 'pendingScans'
const RATE_LIMIT_KEY = 'vtRateLimit'

export async function getScanHistory() {
  const result = await chrome.storage.local.get(HISTORY_KEY)
  return result[HISTORY_KEY] || []
}

export async function addScanResult(entry) {
  const history = await getScanHistory()
  history.unshift({ ...entry, scannedAt: Date.now() })
  await chrome.storage.local.set({ [HISTORY_KEY]: history.slice(0, 200) })
}

export async function deleteEntry(scannedAt) {
  const history = await getScanHistory()
  const filtered = history.filter(e => e.scannedAt !== scannedAt)
  await chrome.storage.local.set({ [HISTORY_KEY]: filtered })
}

export async function clearHistory() {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] })
}

export async function getSettings() {
  const result = await chrome.storage.sync.get(SETTINGS_KEY)
  return result[SETTINGS_KEY] || {
    autoScan: true,
    notifyOnThreat: true,
    uploadUnknown: false,
    apiKey: '',
  }
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings })
}

/**
 * Pending scans — persisted job queue.
 * Keyed by a unique job id (we use the download id as a string).
 * Each job survives service worker restarts, unlike the old in-memory queue.
 *
 * Job shape:
 * {
 *   filename, url, fileSize,
 *   stage: 'submit' | 'poll',
 *   analysisId: string | null,
 *   attempts: number,
 *   createdAt: number,
 *   lastAttemptAt: number
 * }
 */
export async function getPendingScans() {
  const result = await chrome.storage.local.get(PENDING_SCANS_KEY)
  return result[PENDING_SCANS_KEY] || {}
}

export async function savePendingScan(jobId, job) {
  const all = await getPendingScans()
  all[jobId] = job
  await chrome.storage.local.set({ [PENDING_SCANS_KEY]: all })
}

export async function deletePendingScan(jobId) {
  const all = await getPendingScans()
  delete all[jobId]
  await chrome.storage.local.set({ [PENDING_SCANS_KEY]: all })
}


export async function getLastVtCallAt() {
  const result = await chrome.storage.local.get(RATE_LIMIT_KEY)
  return result[RATE_LIMIT_KEY]?.lastCallAt || 0
}

export async function setLastVtCallAt(timestamp) {
  await chrome.storage.local.set({ [RATE_LIMIT_KEY]: { lastCallAt: timestamp } })
}