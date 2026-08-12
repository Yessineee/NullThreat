/* global chrome */
import { submitUrlForScan, pollAnalysisOnce } from './vtClient.js'
import { canMakeVtCall, markVtCallMade } from './rateLimiter.js'
import { notifyScanning, notifyResult, notifyError } from './notifications.js'
import { addScanResult, getPendingScans, savePendingScan, deletePendingScan } from '../storage/store.js'

export const SCAN_ALARM_NAME = 'nullthreat-scan-tick'

// If a job hasn't resolved after this long, give up and mark it unknown
// instead of leaving the UI stuck on "scanning" forever.
const MAX_SCAN_AGE_MS = 6 * 60 * 1000 // 6 minutes
const MAX_POLL_ATTEMPTS = 25

/* Ensures the recurring alarm exists. Safe to call on every worker wake — it checks first so it doesn't keep resetting the timer.
  Note: chrome.alarms enforces a 1-minute minimum period for published extensions. Unpacked (developer mode) extensions can use shorter periods, which is what we rely on here since this runs via "Load
  unpacked". If this is ever published to the Web Store, bump this to 1 minute minimum.
*/

export async function ensureAlarm() {
  const alarm = await chrome.alarms.get(SCAN_ALARM_NAME)
  if (!alarm) {
    chrome.alarms.create(SCAN_ALARM_NAME, { periodInMinutes: 0.5 })
  }
}

/* Registers a new scan job from a completed download and kicks off the first step immediately (fast — just the submit fetch). */
export async function createScanJob(jobId, { filename, url, fileSize }) {
  const job = {
    filename,
    url,
    fileSize,
    stage: 'submit',
    analysisId: null,
    attempts: 0,
    createdAt: Date.now(),
    lastAttemptAt: Date.now(),
  }

  await savePendingScan(jobId, job)
  await notifyScanning(jobId, filename)
  await ensureAlarm()

  
  await runScanTick()
}


export async function runScanTick() {
  const jobs = await getPendingScans()
  const ids = Object.keys(jobs)
  if (ids.length === 0) return

  // First, resolve any jobs that have been pending too long — this is what makes the "stuck scanning forever" bug impossible now.
  
  const now = Date.now()
  for (const id of ids) {
    if (now - jobs[id].createdAt > MAX_SCAN_AGE_MS) {
      await finalizeUnknown(id, jobs[id])
    }
  }

  const remaining = await getPendingScans()
  const remainingIds = Object.keys(remaining)
  if (remainingIds.length === 0) return

  const canCall = await canMakeVtCall()
  if (!canCall) return // wait for the next tick, don't burn quota

  const sorted = remainingIds.sort((a, b) => remaining[a].createdAt - remaining[b].createdAt)
  const activeId = sorted[0]
  const job = remaining[activeId]

  if (job.stage === 'submit') {
    try {
      const analysisId = await submitUrlForScan(job.url)
      await markVtCallMade()
      await savePendingScan(activeId, {
        ...job,
        stage: 'poll',
        analysisId,
        attempts: 0,
        lastAttemptAt: Date.now(),
      })
    } catch (err) {
      console.error('Scan submit failed:', err.message)
      await finalizeError(activeId, job)
    }
    return
  }

  if (job.stage === 'poll') {
    try {
      const outcome = await pollAnalysisOnce(job.analysisId)
      await markVtCallMade()

      if (outcome.status === 'pending') {
        const attempts = job.attempts + 1
        if (attempts >= MAX_POLL_ATTEMPTS) {
          await finalizeUnknown(activeId, job)
        } else {
          await savePendingScan(activeId, { ...job, attempts, lastAttemptAt: Date.now() })
        }
        return
      }

      await finalizeResult(activeId, job, outcome)
    } catch (err) {
      console.error('Scan poll failed:', err.message)
      await finalizeError(activeId, job)
    }
  }
}

async function finalizeResult(jobId, job, result) {
  await addScanResult({
    filename: job.filename,
    hash: null,
    url: job.url,
    fileSize: job.fileSize,
    ...result,
  })
  await deletePendingScan(jobId)
  await notifyResult(jobId, job.filename, result)
}

async function finalizeUnknown(jobId, job) {
  const result = { status: 'unknown', threatScore: 0, malicious: 0, total: 0, engines: {} }
  await addScanResult({
    filename: job.filename,
    hash: null,
    url: job.url,
    fileSize: job.fileSize,
    ...result,
  })
  await deletePendingScan(jobId)
  await notifyResult(jobId, job.filename, result)
}

async function finalizeError(jobId, job) {
  await deletePendingScan(jobId)
  await notifyError(jobId, job.filename)
}