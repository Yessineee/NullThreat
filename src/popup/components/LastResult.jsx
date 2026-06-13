import { FileText, Clock } from 'lucide-react'
import ThreatBadge from './ThreatBadge.jsx'
import ThreatScore from './ThreatScore.jsx'

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function LastResult({ scan }) {
  if (!scan) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <FileText className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No scans yet</p>
        <p className="text-[10px] text-muted-foreground/60">
          Download a PDF to scan it automatically
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
      <ThreatScore score={scan.threatScore || 0} size={44} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{scan.filename}</p>
        <div className="flex items-center gap-2 mt-1">
          <ThreatBadge status={scan.status} />
          <span className="text-[10px] text-muted-foreground">
            {scan.total > 0 ? `${scan.malicious}/${scan.total} engines` : 'No engine data'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60">{timeAgo(scan.scannedAt)}</span>
        </div>
      </div>
    </div>
  )
}