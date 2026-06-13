/* global chrome */
import { useState, useEffect, useCallback } from 'react'
import { getScanHistory, getSettings, saveSettings, clearHistory, deleteEntry } from '../../storage/store.js'

export function useDashboardData() {
  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [h, s] = await Promise.all([getScanHistory(), getSettings()])
    setHistory(h)
    setSettings(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [h, s] = await Promise.all([getScanHistory(), getSettings()])
      if (cancelled) return
      setHistory(h)
      setSettings(s)
      setLoading(false)
    }

    init()

    const handleMessage = (message) => {
      if (['SCAN_COMPLETE', 'SCAN_ERROR'].includes(message.type)) {
        loadData()
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      cancelled = true
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [loadData])

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
    updateSetting,
    clearHistory: handleClearHistory,
    deleteEntry: handleDeleteEntry,
    reload: loadData,
  }
}