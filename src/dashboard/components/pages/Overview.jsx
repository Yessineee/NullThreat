import { FileText, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import StatCard from '../shared/StatCard.jsx'
import ThreatScore from '../shared/ThreatScore.jsx'
import ThreatBadge from '../shared/ThreatBadge.jsx'

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function DonutChart({ clean, threats, unknown, total }) {
  const size = 120
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const segments = [
    { value: clean, color: '#22c55e' },
    { value: threats, color: '#ef4444' },
    { value: unknown, color: '#6b7280' },
  ]

  let offset = 0
  const paths = segments.map((seg, i) => {
    const ratio = total > 0 ? seg.value / total : 0
    const dash = ratio * circumference
    const gap = circumference - dash
    const path = (
      <circle
        key={i}
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth="16"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        className="-rotate-90"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
    )
    offset += dash
    return path
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={radius} fill="none"
          stroke="currentColor" strokeWidth="16" className="text-border" />
        {total > 0 && paths}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-mono font-semibold text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground">total</span>
      </div>
    </div>
  )
}

export default function Overview({ history, stats, currentScan, onNavigate }) {
  const recent = history.slice(0, 5)

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Scanned"
          value={stats.total}
          icon={FileText}
          accent="brand"
        />
        <StatCard
          label="Threats Found"
          value={stats.threats}
          icon={ShieldAlert}
          accent="threat"
          sub={stats.total > 0
            ? `${Math.round((stats.threats / stats.total) * 100)}% of scans`
            : 'No scans yet'}
        />
        <StatCard
          label="Clean Files"
          value={stats.clean}
          icon={ShieldCheck}
          accent="brand"
          sub={stats.total > 0
            ? `${Math.round((stats.clean / stats.total) * 100)}% of scans`
            : 'No scans yet'}
        />
        <StatCard
          label="Unknown"
          value={stats.unknown}
          icon={ShieldQuestion}
          accent="muted"
        />
      </div>

      {/* Active scan banner */}
      {currentScan?.scanning && (
        <div className="flex items-center gap-4 px-5 py-4 bg-brand-500/5 border border-brand-500/20 rounded-xl">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Scanning in progress</p>
            <p className="text-xs text-muted-foreground font-mono">{currentScan.filename}</p>
          </div>
          <p className="text-xs text-muted-foreground ml-auto">
            Querying VirusTotal... this may take up to 90 seconds
          </p>
        </div>
      )}

      {/* Recent scans + donut */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent scans */}
        <div className="col-span-2 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">Recent Scans</p>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <FileText className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No scans yet</p>
                <p className="text-xs text-muted-foreground/60">Download a PDF to get started</p>
              </div>
            ) : recent.map((scan) => (
              <div
                key={scan.scannedAt}
                onClick={() => onNavigate('detail', scan)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
              >
                <ThreatScore score={scan.threatScore || 0} status={scan.status} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{scan.filename}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ThreatBadge status={scan.status} size="sm" />
                    {scan.total > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {scan.malicious}/{scan.total} engines
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {timeAgo(scan.scannedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat breakdown */}
        <div className="bg-card border border-border rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">Threat Breakdown</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-5">
            <DonutChart
              clean={stats.clean}
              threats={stats.threats}
              unknown={stats.unknown}
              total={stats.total}
            />
            <div className="flex flex-col gap-2 w-full">
              {[
                { label: 'Clean', value: stats.clean, color: 'bg-brand-500' },
                { label: 'Threat', value: stats.threats, color: 'bg-destructive' },
                { label: 'Unknown', value: stats.unknown, color: 'bg-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-mono font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}