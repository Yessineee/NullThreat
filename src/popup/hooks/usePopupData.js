import { useState, useEffect, useCallback } from 'react'
import { getScanHistory, getSettings, saveSettings, getPendingScans } from '../../storage/store.js'

export function usePopupData() {
  const [settings, setSettings] = useState(null)
  const [history, setHistory] = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanningFile, setScanningFile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [s, h] = await Promise.all([getSettings(), getScanHistory()])
    setSettings(s)
    setHistory(h)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    let pollInterval = null

    async function init() {
      const [s, h] = await Promise.all([getSettings(), getScanHistory()])
      if (cancelled) return
      setSettings(s)
      setHistory(h)
      setLoading(false)
    }

    
    async function pollScanState() {
      const pending = await getPendingScans()
      const jobs = Object.values(pending)

      if (jobs.length > 0) {
        const oldest = jobs.sort((a, b) => a.createdAt - b.createdAt)[0]
        setScanning(true)
        setScanningFile(oldest.filename)
      } else {
        setScanning(false)
        setScanningFile(null)
        const h = await getScanHistory()
        if (!cancelled) setHistory(h)
      }
    }

    init()
    pollInterval = setInterval(pollScanState, 1000)
    return () => {
      cancelled = true
      clearInterval(pollInterval)
    }
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await saveSettings(updated)
  }, [settings])

  const lastScan = history[0] || null
  const totalScanned = history.length
  const threatsFound = history.filter(s => s.status === 'threat').length

  return {
    settings,
    history,
    scanning,
    scanningFile,
    loading,
    lastScan,
    totalScanned,
    threatsFound,
    updateSetting,
    reload: loadData,
  }
}