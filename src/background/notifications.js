/* global chrome */
import { getSettings } from '../storage/store.js'

export async function notifyScanning(jobId, filename) {
  await chrome.notifications.create(`scanning-${jobId}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat: Scanning',
    message: `Scanning ${filename}...`,
    priority: 0,
  })
}

export async function notifyResult(jobId, filename, result) {
  chrome.notifications.clear(`scanning-${jobId}`)

  const { notifyOnClean } = await getSettings()
  if (result.status === 'clean' && !notifyOnClean) return

  const messages = {
    clean: {
      title: 'NullThreat: Clean',
      message: `${filename} is safe (0/${result.total} engines)`,
    },
    threat: {
      title: 'NullThreat: Threat Detected',
      message: `${filename} flagged by ${result.malicious}/${result.total} engines`,
    },
    unknown: {
      title: 'NullThreat: Unknown File',
      message: `${filename} could not be verified in time`,
    },
  }

  const { title, message } = messages[result.status] || messages.unknown

  chrome.notifications.create(`result-${jobId}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title,
    message,
    priority: result.status === 'threat' ? 2 : 1,
  })
}

export async function notifyError(jobId, filename) {
  chrome.notifications.clear(`scanning-${jobId}`)
  await chrome.notifications.create(`error-${jobId}`, {
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'NullThreat: Scan Failed',
    message: `Could not scan ${filename}. Check your API key.`,
    priority: 0,
  })
}