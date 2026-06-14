/* global chrome */
import { useState, useEffect, useCallback } from 'react'
import { getScanHistory, getSettings, saveSettings } from '../../storage/store.js'

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
    const result = await chrome.storage.local.get('currentScan')
    const current = result.currentScan
    if (current?.scanning) {
      setScanning(true)
      setScanningFile(current.filename)
    } else {
      setScanning(false)
      setScanningFile(null)
      const h = await getScanHistory()
      setHistory(h)
    }
  }

    init()
    pollInterval = setInterval(pollScanState, 1000)
    return () => {
    cancelled = true
    clearInterval(pollInterval)
  }

    // const handleMessage = (message) => {
    //   if (message.type === 'SCAN_STARTED') {
    //     setScanning(true)
    //     setScanningFile(message.filename)
    //   }
    //   if (message.type === 'SCAN_COMPLETE') {
    //     setScanning(false)
    //     setScanningFile(null)
    //     loadData()
    //   }
    //   if (message.type === 'SCAN_ERROR') {
    //     setScanning(false)
    //     setScanningFile(null)
    //   }
    // }

    // chrome.runtime.onMessage.addListener(handleMessage)
    // return () => {
    //   cancelled = true
    //   chrome.runtime.onMessage.removeListener(handleMessage)
    // }
    
  }, [loadData])

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