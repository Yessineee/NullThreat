/* global chrome */

import { Moon, Sun, LayoutDashboard, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePopupData } from './hooks/usePopupData.js'
import ApiKeySetup from './components/ApiKeySetup.jsx'
import ScanningState from './components/ScanningState.jsx'
import LastResult from './components/LastResult.jsx'
import { cn } from '../lib/utils.js'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    chrome.storage.sync.get('theme', (res) => {
      const isDark = res.theme !== 'light'
      setDark(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    })
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    chrome.storage.sync.set({ theme: next ? 'dark' : 'light' })
  }

  return [dark, toggle]
}

function openDashboard() {
  const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html')
  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find(t => t.url === dashboardUrl)
    if (existing) {
      chrome.tabs.update(existing.id, { active: true })
      chrome.windows.update(existing.windowId, { focused: true })
    } else {
      chrome.tabs.create({ url: dashboardUrl })
    }
  })
}

export default function Popup() {
  const [dark, toggleDark] = useDarkMode()
  const {
    settings,
    scanning,
    scanningFile,
    loading,
    lastScan,
    totalScanned,
    threatsFound,
    updateSetting,
    reload,
  } = usePopupData()

  if (loading) {
    return (
      <div className="w-[380px] bg-background flex items-center justify-center py-8">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
    )
  }

  if (!settings?.apiKey) {
    return (
      <div className="w-[380px] bg-background">
        <ApiKeySetup onSaved={reload} />
      </div>
    )
  }

  return (
    <div className="w-[380px] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/icons/icon48.png" className="w-5 h-5 rounded" alt="NullThreat" />
          <span className="text-sm font-semibold text-foreground font-mono">NullThreat</span>
        </div>
        <button
          onClick={toggleDark}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {dark
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary rounded-lg p-3 border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Scanned</p>
            <p className="text-xl font-mono font-semibold text-foreground mt-0.5">{totalScanned}</p>
          </div>
          <div className="bg-secondary rounded-lg p-3 border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Threats Found</p>
            <p className={cn(
              'text-xl font-mono font-semibold mt-0.5',
              threatsFound > 0 ? 'text-destructive' : 'text-foreground'
            )}>
              {threatsFound}
            </p>
          </div>
        </div>

        {/* Scan status or last result */}
        {scanning
          ? <ScanningState filename={scanningFile} />
          : <LastResult scan={lastScan} />
        }

        {/* Auto-scan toggle */}
        <div className="flex items-center justify-between py-2 border-t border-border">
          <div>
            <p className="text-xs font-medium text-foreground">Auto-scan downloads</p>
            <p className="text-[10px] text-muted-foreground">Scan PDFs automatically when downloaded</p>
          </div>
          <button
            onClick={() => updateSetting('autoScan', !(settings?.autoScan ?? true))}
            className="text-brand-500 hover:text-brand-600 transition-colors"
          >
            {(settings?.autoScan ?? true)
              ? <ToggleRight className="w-8 h-8" />
              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Open dashboard */}
        <button
          onClick={openDashboard}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'py-2 rounded-lg text-sm font-medium',
            'bg-brand-500 text-white hover:bg-brand-600 transition-colors'
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Open Dashboard
        </button>
      </div>
    </div>
  )
}