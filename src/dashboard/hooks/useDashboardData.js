/* global chrome */
import { useState, useEffect, useCallback } from 'react'
import { getScanHistory, getSettings, saveSettings, clearHistory, deleteEntry } from '../../storage/store.js'

export function useDashboardData() {
  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentScan, setCurrentScan] = useState(null)


  const loadData = useCallback(async () => {
    const [h, s, scanState] = await Promise.all([getScanHistory(), getSettings(), chrome.storage.local.get('currentScan')])
    setHistory(h)
    setSettings(s)
    setCurrentScan(scanState.currentScan || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [h, s, scanState] = await Promise.all([getScanHistory(), getSettings(), chrome.storage.local.get('currentScan')])
      if (cancelled) return
      setHistory(h)
      setSettings(s)
      setCurrentScan(scanState.currentScan || null)
      setLoading(false)
    }

    async function backgroundRefresh() {
    const [h, s, scanState] = await Promise.all([getScanHistory(), getSettings(), chrome.storage.local.get('currentScan')
])
    if (cancelled) return
    setHistory(h)
    setSettings(s)
    setCurrentScan(scanState.currentScan || null)
    
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') backgroundRefresh()
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') backgroundRefresh()
    }, 30000) // 30s for an extension is more appropriate than 60s

    window.addEventListener('focus', backgroundRefresh)
    document.addEventListener('visibilitychange', onVisibilityChange)

    init()

    

    return () => {
      cancelled = true
      clearInterval(intervalId)
      window.removeEventListener('focus', backgroundRefresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
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
    currentScan,
    updateSetting,
    clearHistory: handleClearHistory,
    deleteEntry: handleDeleteEntry,
    reload: loadData,
  }
}