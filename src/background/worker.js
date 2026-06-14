/* global chrome */
import { scanByUrl } from './vtClient.js'
import { enqueue } from './scanQueue.js'
import { addScanResult, getSettings } from '../storage/store.js'


// Cache downloads as they are created
const downloadCache = new Map()

chrome.downloads.onCreated.addListener((item) => {
  downloadCache.set(item.id, item)
})

chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state?.current !== 'complete') return


  const item = downloadCache.get(delta.id)

  if (!item) {
    return
  }

  downloadCache.delete(delta.id)

  const settings = await getSettings()
  const autoScan = settings.autoScan ?? true 
  
  if (!autoScan) return
  const isPdf = item.mime === 'application/pdf' || item.url.toLowerCase().includes('.pdf') || item.finalUrl?.toLowerCase().includes('.pdf')
  
  if (!isPdf) {
    return
   }
    


  // await chrome.storage.local.set({ currentScan: { scanning: true, filename: getFilename(item) } })
  await chrome.storage.local.set({ 
  currentScan: { 
    scanning: true, 
    filename: getFilename(item),
    startedAt: Date.now()
  } 
  })
  await notifyScanning(item)
  try {
  const scanUrl = item.finalUrl || item.url

  const result = await enqueue(() => scanByUrl(scanUrl))

  await addScanResult({
    filename: (item.finalUrl || item.url).split('/').pop().split('?')[0],
    hash: null,
    url: item.url,
    fileSize: item.fileSize || item.totalBytes,
    ...result,
  })
  await chrome.storage.local.set({ currentScan: { scanning: false, filename: null } })


  await notifyResult(item, result)
} catch (err) {
 
  console.error('Scan failed:', err.message)
  console.error('Full error:', err)
  await notifyError(item)
  await chrome.storage.local.set({ currentScan: { scanning: false, filename: null } })
}
})

async function notifyScanning(item) {
  const filename = getFilename(item)
  await chrome.notifications.create(`scanning-${item.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat: Scanning',
    message: `Scanning ${filename}...`,
    priority: 0,
  })
}

async function notifyResult(item, result) {
  const filename = getFilename(item)
  chrome.notifications.clear(`scanning-${item.id}`)

  const { notifyOnClean } = await getSettings()

  if (result.status === 'clean' && !notifyOnClean) return


  const messages = {
    clean: {
      title: 'NullThreat: Clean',
      message: `${filename} is safe (0/${result.total} engines)`,
    },
    threat: {
      title: 'NullThreat:  Threat Detected',
      message: `${filename} flagged by ${result.malicious}/${result.total} engines`,
    },
    unknown: {
      title: 'NullThreat: Unknown File',
      message: `${filename} could not be verified - not in VirusTotal database`,
    },
  }

  const { title, message } = messages[result.status] || messages.unknown

  chrome.notifications.create(`result-${item.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title,
    message,
    priority: result.status === 'threat' ? 2 : 1,
  })
}

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

async function notifyError(item) {
  const filename = getFilename(item)
  chrome.notifications.clear(`scanning-${item.id}`)
  await chrome.notifications.create(`error-${item.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat: Scan Failed',
    message: `Could not scan ${filename}. Check your API key.`,
    priority: 0,
  })
}

function getFilename(item) {
  return item.filename ? item.filename.split('\\').pop().split('/').pop() : (item.finalUrl || item.url).split('/').pop().split('?')[0]
}