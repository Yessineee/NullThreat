/* global chrome */
import { sha256FromBlob } from '../utils/hash.js'
import { scanByHash, scanByUrl } from './vtClient.js'
import { enqueue } from './scanQueue.js'
import { addScanResult, getSettings } from '../storage/store.js'


// Cache downloads as they are created
const downloadCache = new Map()

chrome.downloads.onCreated.addListener((item) => {
  console.log('Download created:', item.id, item.filename, item.url)
  downloadCache.set(item.id, item)
})

chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state?.current !== 'complete') return


  const item = downloadCache.get(delta.id)

  if (!item) {
    console.log('Item not in cache for id:', delta.id)
    return
  }

  downloadCache.delete(delta.id)

  const settings = await getSettings()
  const autoScan = settings.autoScan ?? true 
  
  if (!autoScan) return
  const isPdf = item.mime === 'application/pdf' || item.url.toLowerCase().includes('.pdf') || item.finalUrl?.toLowerCase().includes('.pdf')
  
  if (!isPdf) {
    console.log('Not a PDF, skipping')
    return
   }
    

  console.log('PDF detected, attempting scan...')
  notifyScanning(item)
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

  notifyResult(item, result)
} catch (err) {
  console.error('Scan failed:', err.message)
  console.error('Full error:', err)
  notifyError(item)
}
})

function notifyScanning(item) {
  const filename = getFilename(item)
  chrome.notifications.create(`scanning-${item.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat — Scanning',
    message: `Scanning ${filename}...`,
    priority: 0,
  })
}

function notifyResult(item, result) {
  const filename = getFilename(item)
  chrome.notifications.clear(`scanning-${item.id}`)

  const messages = {
    clean: {
      title: 'NullThreat — Clean',
      message: `${filename} is safe (0/${result.total} engines)`,
    },
    threat: {
      title: 'NullThreat — Threat Detected',
      message: `${filename} flagged by ${result.malicious}/${result.total} engines`,
    },
    unknown: {
      title: 'NullThreat — Unknown File',
      message: `${filename} is not in VirusTotal database`,
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

function notifyError(item) {
  const filename = getFilename(item)
  chrome.notifications.clear(`scanning-${item.id}`)
  chrome.notifications.create(`error-${item.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat — Scan Failed',
    message: `Could not scan ${filename}. Check your API key.`,
    priority: 0,
  })
}

function getFilename(item) {
  return item.filename ? item.filename.split('\\').pop().split('/').pop() : (item.finalUrl || item.url).split('/').pop().split('?')[0]
}