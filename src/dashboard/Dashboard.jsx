/* global chrome */
import { useState, useEffect } from 'react'
import { useDashboardData } from './hooks/useDashboardData.js'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import Overview from './components/pages/Overview.jsx'
import History from './components/pages/History.jsx'
import ThreatDetail from './components/pages/ThreatDetail.jsx'
import Settings from './components/pages/Settings.jsx'

const PAGE_META = {
  overview: { title: 'Overview', subtitle: 'Your scan activity at a glance' },
  history: { title: 'Scan History', subtitle: 'All PDF scans with full details' },
  detail: { title: 'Threat Detail', subtitle: 'Full engine breakdown and file metadata' },
  settings: { title: 'Settings', subtitle: 'Configure NullThreat to your preferences' },
}

export default function Dashboard() {
  const [page, setPage] = useState('overview')
  const [selectedScan, setSelectedScan] = useState(null)
  const { history, settings, stats, currentScan, loading, updateSetting, clearHistory, deleteEntry, reload } = useDashboardData()

  // Sync theme on mount
  useEffect(() => {
    chrome.storage.sync.get('theme', (res) => {
      const isDark = res.theme !== 'light'
      document.documentElement.classList.toggle('dark', isDark)
    })
  }, [])

  function navigate(target, scan = null) {
    setPage(target)
    if (scan) setSelectedScan(scan)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Loading NullThreat...</p>
        </div>
      </div>
    )
  }

  const meta = PAGE_META[page] || PAGE_META.overview

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentPage={page} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onRefresh={reload}
        />

        <main className="flex-1 overflow-y-auto">
          {page === 'overview' && (
            <Overview
              history={history}
              stats={stats}
              currentScan={currentScan}
              onNavigate={navigate}
            />
          )}
          {page === 'history' && (
            <History
              history={history}
              onNavigate={navigate}
              onDelete={deleteEntry}
            />
          )}
          {page === 'detail' && selectedScan && (
            <ThreatDetail
              scan={selectedScan}
              onBack={() => navigate('history')}
            />
          )}
          {page === 'settings' && (
            <Settings
              settings={settings}
              updateSetting={updateSetting}
              clearHistory={clearHistory}
            />
          )}
        </main>
      </div>
    </div>
  )
}