import { useState, useMemo } from 'react'
import { Search, Download, Trash2, ChevronRight } from 'lucide-react'
import ThreatScore from '../shared/ThreatScore.jsx'
import ThreatBadge from '../shared/ThreatBadge.jsx'
import { cn } from '../../../lib/utils.js'

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function exportCSV(history) {
  const headers = ['Filename', 'Status', 'Threat Score', 'Malicious Engines', 'Total Engines', 'Scanned At', 'URL']
  const rows = history.map(s => [
    `"${s.filename}"`,
    s.status,
    s.threatScore || 0,
    s.malicious || 0,
    s.total || 0,
    new Date(s.scannedAt).toISOString(),
    `"${s.url || ''}"`,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nullthreat-history-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_FILTERS = ['all', 'clean', 'threat', 'unknown']

export default function History({ history, currentScan, onNavigate, onDelete }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return history.filter(s => {
      const matchesSearch = s.filename.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [history, search, statusFilter])

  return (
    <div className="p-6 flex flex-col gap-4">
      {currentScan?.scanning && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-500/5 border border-brand-500/20 rounded-xl">
          <div className="w-5 h-5 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-foreground">
            Scanning <span className="font-mono text-brand-500">{currentScan.filename}</span>...
          </p>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                statusFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => exportCSV(history)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Score', 'Filename', 'Status', 'Engines', 'Scanned', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  {search || statusFilter !== 'all' ? 'No results match your filters' : 'No scans yet'}
                </td>
              </tr>
            ) : filtered.map((scan) => (
              <tr
                key={scan.scannedAt}
                onClick={() => onNavigate('detail', scan)}
                className="hover:bg-secondary/50 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <ThreatScore score={scan.threatScore || 0} status={scan.status} size={36} />
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {scan.filename}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[200px]">
                    {scan.url}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <ThreatBadge status={scan.status} size="md" />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-foreground">
                    {scan.total > 0 ? `${scan.malicious}/${scan.total}` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{timeAgo(scan.scannedAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(scan.scannedAt) }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {history.length} entries
        </p>
      )}
    </div>
  )
}