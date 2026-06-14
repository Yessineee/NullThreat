/* global chrome */
import { useState, useEffect } from 'react'
import { LayoutDashboard, History, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/utils.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'history', label: 'Scan History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('sidebarCollapsed', (res) => {
      if (res.sidebarCollapsed !== undefined) {
        setCollapsed(res.sidebarCollapsed)
      }
    })
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    chrome.storage.local.set({ sidebarCollapsed: next })
  }

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-card border-r-2 border-border',
      'transition-all duration-300 ease-in-out flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-0'
      )}>
        <img src="/icons/icon48.png" className="w-7 h-7 rounded-lg flex-shrink-0" alt="NullThreat" />
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-foreground font-mono">NullThreat</p>
            <p className="text-[10px] text-muted-foreground">v1.0.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left',
              collapsed && 'justify-center px-0',
              currentPage === id
                ? 'bg-brand-500/10 text-brand-500 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={toggleCollapse}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full',
            'text-muted-foreground hover:text-foreground hover:bg-secondary transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
          }
        </button>
      </div>
    </aside>
  )
}