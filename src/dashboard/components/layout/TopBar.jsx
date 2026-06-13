/* global chrome */
import { Moon, Sun, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../../../lib/utils.js'

export default function TopBar({ title, subtitle, onRefresh }) {
  const [dark, setDark] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    chrome.storage.sync.get('theme', (res) => {
      const isDark = res.theme !== 'light'
      setDark(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    })
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    chrome.storage.sync.set({ theme: next ? 'dark' : 'light' })
  }

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}