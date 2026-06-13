/* global chrome */

const HISTORY_KEY = 'scan_history'
const SETTINGS_KEY = 'settings'

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