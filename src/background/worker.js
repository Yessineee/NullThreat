/* global chrome */
import { getSettings } from '../storage/store.js'
import { ensureAlarm, createScanJob, runScanTick, SCAN_ALARM_NAME } from './scanManager.js'

const downloadCache = new Map()

chrome.downloads.onCreated.addListener((item) => {
  downloadCache.set(item.id, item)
})

chrome.downloads.onChanged.addListener(async (delta) => {
  // Opportunistic nudge: any download activity is a chance to advance
  // the pending scan queue, on top of the alarm tick.
  runScanTick()

  if (delta.state?.current !== 'complete') return

  const item = downloadCache.get(delta.id)
  if (!item) return
  downloadCache.delete(delta.id)

  const settings = await getSettings()
  const autoScan = settings.autoScan ?? true
  if (!autoScan) return

  const isPdf = item.mime === 'application/pdf' ||
    item.url.toLowerCase().includes('.pdf') ||
    item.finalUrl?.toLowerCase().includes('.pdf')
  if (!isPdf) return

  const jobId = String(item.id)
  const filename = getFilename(item)
  const scanUrl = item.finalUrl || item.url

  await createScanJob(jobId, {
    filename,
    url: scanUrl,
    fileSize: item.fileSize || item.totalBytes,
  })
})

// Alarm-driven resumable processing — this is what survives service
// worker restarts. Each tick advances exactly one pending job by one
// step (submit or poll), rate-limited via storage so it's safe even
// if the worker restarts between ticks.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCAN_ALARM_NAME) {
    runScanTick()
  }
})

// Make sure the alarm exists after browser restarts or extension updates.
chrome.runtime.onStartup.addListener(() => {
  ensureAlarm()
  runScanTick()
})
chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm()
  runScanTick()
})

chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId)

  const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html')
  const tabs = await chrome.tabs.query({})
  const existing = tabs.find(t => t.url === dashboardUrl)
  if (existing) {
    chrome.tabs.update(existing.id, { active: true })
    chrome.windows.update(existing.windowId, { focused: true })
  } else {
    chrome.tabs.create({ url: dashboardUrl })
  }
})

function getFilename(item) {
  return item.filename
    ? item.filename.split('\\').pop().split('/').pop()
    : (item.finalUrl || item.url).split('/').pop().split('?')[0]
}