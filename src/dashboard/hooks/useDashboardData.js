import { useState, useEffect, useCallback } from 'react'
import { getScanHistory, getSettings, saveSettings, clearHistory, deleteEntry, getPendingScans,} from '../../storage/store.js'

function deriveCurrentScan(pendingMap) {
  const jobs = Object.values(pendingMap)
  if (jobs.length === 0) return null
  const oldest = jobs.sort((a, b) => a.createdAt - b.createdAt)[0]
  return { scanning: true, filename: oldest.filename }
}

export function useDashboardData() {
  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentScan, setCurrentScan] = useState(null)

  const loadData = useCallback(async () => {
    const [h, s, pending] = await Promise.all([getScanHistory(), getSettings(), getPendingScans()])
    setHistory(h)
    setSettings(s)
    setCurrentScan(deriveCurrentScan(pending))
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [h, s, pending] = await Promise.all([getScanHistory(), getSettings(), getPendingScans()])
      if (cancelled) return
      setHistory(h)
      setSettings(s)
      setCurrentScan(deriveCurrentScan(pending))
      setLoading(false)
    }

    async function backgroundRefresh() {
      const [h, s, pending] = await Promise.all([getScanHistory(), getSettings(), getPendingScans()])
      if (cancelled) return
      setHistory(h)
      setSettings(s)
      setCurrentScan(deriveCurrentScan(pending))
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') backgroundRefresh()
    }

    // Poll every 5s while visible — fast enough to see scan progress,
    // and derived from storage so it can never get stuck showing a
    // scan that isn't actually pending anymore.
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') backgroundRefresh()
    }, 5000)

    window.addEventListener('focus', backgroundRefresh)
    document.addEventListener('visibilitychange', onVisibilityChange)

    init()

    return () => {
      cancelled = true
      clearInterval(intervalId)
      window.removeEventListener('focus', backgroundRefresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await saveSettings(updated)
  }, [settings])

  const handleClearHistory = useCallback(async () => {
    await clearHistory()
    setHistory([])
  }, [])

  const handleDeleteEntry = useCallback(async (scannedAt) => {
    await deleteEntry(scannedAt)
    setHistory(prev => prev.filter(e => e.scannedAt !== scannedAt))
  }, [])

  const stats = {
    total: history.length,
    threats: history.filter(e => e.status === 'threat').length,
    clean: history.filter(e => e.status === 'clean').length,
    unknown: history.filter(e => e.status === 'unknown').length,
  }

  return {
    history,
    settings,
    loading,
    stats,
    currentScan,
    updateSetting,
    clearHistory: handleClearHistory,
    deleteEntry: handleDeleteEntry,
    reload: loadData,
  }
}