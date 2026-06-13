import { useState } from 'react'
import { ArrowLeft, FileText, Hash, Link, Calendar, ExternalLink, Search, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import ThreatScore from '../shared/ThreatScore.jsx'
import ThreatBadge from '../shared/ThreatBadge.jsx'
import { cn } from '../../../lib/utils.js'

function EngineRow({ name, result }) {
  const verdict = result?.category || result?.result || 'undetected'
  const isMalicious = result?.category === 'malicious'
  const isSuspicious = result?.category === 'suspicious'

  return (
    <tr className={cn(
      'border-b border-border transition-colors',
      isMalicious && 'bg-destructive/5',
    )}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          {isMalicious
            ? <ShieldAlert className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
            : isSuspicious
              ? <ShieldQuestion className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              : <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
          }
          <span className="text-sm text-foreground">{name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={cn(
          'text-xs font-mono',
          isMalicious && 'text-destructive font-medium',
          isSuspicious && 'text-yellow-500',
          !isMalicious && !isSuspicious && 'text-muted-foreground'
        )}>
          {result?.result || 'clean'}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full capitalize',
          isMalicious && 'bg-destructive/10 text-destructive',
          isSuspicious && 'bg-yellow-500/10 text-yellow-500',
          !isMalicious && !isSuspicious && 'bg-muted text-muted-foreground'
        )}>
          {verdict}
        </span>
      </td>
    </tr>
  )
}

export default function ThreatDetail({ scan, onBack }) {
  const [engineSearch, setEngineSearch] = useState('')

  const engines = scan.engines || {}
  const engineEntries = Object.entries(engines)

  // Sort: malicious first, then suspicious, then rest
  const sorted = [...engineEntries].sort(([, a], [, b]) => {
    const rank = e => e?.category === 'malicious' ? 0 : e?.category === 'suspicious' ? 1 : 2
    return rank(a) - rank(b)
  })

  const filtered = sorted.filter(([name]) =>
    name.toLowerCase().includes(engineSearch.toLowerCase())
  )

  const vtUrl = scan.url ? `https://www.virustotal.com/gui/url/${btoa(scan.url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}` : null

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-5">
        <ThreatScore score={scan.threatScore || 0} status={scan.status} size={100} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-semibold text-foreground truncate">{scan.filename}</h2>
            <ThreatBadge status={scan.status} size="lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Hash className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SHA-256</p>
                <p className="text-xs font-mono text-foreground break-all">
                  {scan.hash || 'N/A — URL scan'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Link className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Source URL</p>
                <p className="text-xs font-mono text-foreground truncate">{scan.url || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">File Size</p>
                <p className="text-xs font-mono text-foreground">
                  {scan.fileSize ? `${(scan.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Scanned At</p>
                <p className="text-xs font-mono text-foreground">
                  {new Date(scan.scannedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {scan.total > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className={cn(
                  'font-semibold',
                  scan.malicious > 0 ? 'text-destructive' : 'text-brand-500'
                )}>
                  {scan.malicious}
                </span>
                {' '}of{' '}
                <span className="font-semibold text-foreground">{scan.total}</span>
                {' '}engines flagged this file
              </p>
              {vtUrl && (
                <a
                    href={vtUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on VirusTotal
                </a>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Engine breakdown */}
      {engineEntries.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Engine Breakdown
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                ({engineEntries.length} engines)
              </span>
            </p>
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search engines..."
                value={engineSearch}
                onChange={e => setEngineSearch(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-32"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  {['Engine', 'Result', 'Category'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(([name, result]) => (
                  <EngineRow key={name} name={name} result={result} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-2">
          <ShieldQuestion className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No engine data available</p>
          <p className="text-xs text-muted-foreground/60">This file was not found in VirusTotal's database</p>
        </div>
      )}
    </div>
  )
}