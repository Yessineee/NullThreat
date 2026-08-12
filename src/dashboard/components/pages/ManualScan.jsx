import { useState, useRef } from 'react'
import { Upload, FileText, FileSearch, AlertCircle, Loader2 } from 'lucide-react'
import ThreatScore from '../shared/ThreatScore.jsx'
import ThreatBadge from '../shared/ThreatBadge.jsx'
import { cn } from '../../../lib/utils.js'

const API_BASE = 'https://pdf-malware-classifier.onrender.com'
const MAX_FILE_SIZE = 20 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 90000

function toDisplayResult(apiResult) {
  return {
    status: apiResult.prediction === 'Malicious' ? 'threat' : 'clean',
    score: Math.round(apiResult.malicious_probability * 100),
    filename: apiResult.filename,
    caveats: apiResult.caveats || [],
  }
}

export default function ManualScan() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  function handleFileSelect(e) {
    const selected = e.target.files[0]
    if (!selected) return

    setResult(null)
    setError(null)

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      setFile(null)
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError(`File exceeds the 20MB limit (${(selected.size / 1024 / 1024).toFixed(1)}MB).`)
      setFile(null)
      return
    }

    setFile(selected)
  }

  async function handleScan() {
    if (!file) return
    setStatus('scanning')
    setError(null)
    setResult(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server returned ${res.status}`)
      }

      const data = await res.json()
      setResult(toDisplayResult(data))
      setStatus('done')
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        setError('The request timed out. The server may be waking from an idle state -- please try again in a moment.')
      } else {
        setError(err.message || 'Unable to reach the classification service.')
      }
      setStatus('error')
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-full bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 shadow-card dark:shadow-card-dark">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload strokeWidth={2.25} className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Manual PDF Analysis</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Analyzes a local PDF using a machine learning classifier trained on
              structural patterns -- an independent signal alongside VirusTotal.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="manual-scan-input"
          />
          <label
            htmlFor="manual-scan-input"
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors text-sm text-muted-foreground"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            {file ? file.name : 'Choose a PDF file...'}
          </label>

          {error && (
            <div className="w-full flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="w-full flex gap-2">
            <button
              onClick={handleScan}
              disabled={!file || status === 'scanning'}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {status === 'scanning' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'scanning' ? 'Analyzing...' : 'Scan File'}
            </button>
            {(file || result) && status !== 'scanning' && (
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg text-sm bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                Reset
              </button>
            )}
          </div>

          {status === 'scanning' && (
            <p className="text-[11px] text-muted-foreground text-center">
              The first request after a period of inactivity may take up to a minute while the server initializes.
            </p>
          )}
        </div>

        <div className="h-full bg-card border border-border rounded-xl p-6 flex flex-col shadow-card dark:shadow-card-dark">
          {result ? (
            <div className="flex items-start gap-5">
              <ThreatScore score={result.score} status={result.status} size={72} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground truncate">{result.filename}</h3>
                  <ThreatBadge status={result.status} size="md" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Malicious probability: <span className="font-mono text-foreground">{result.score}%</span>
                </p>
                {result.caveats.map((caveat) => (
                  <div
                    key={caveat.type}
                    className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 text-xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {caveat.message}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <FileSearch className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No file analyzed yet</p>
              <p className="text-xs text-muted-foreground/60">Select and scan a PDF to see the result here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}