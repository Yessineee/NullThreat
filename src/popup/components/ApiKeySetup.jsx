import { useState } from 'react'
import { Shield, Eye, EyeOff, ExternalLink, Key } from 'lucide-react'
import { saveSettings, getSettings } from '../../storage/store.js'
import { cn } from '../../lib/utils.js'

export default function ApiKeySetup({ onSaved }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!key.trim()) {
      setError('Please enter your API key')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const settings = await getSettings()
      await saveSettings({ ...settings, apiKey: key.trim() })
      onSaved()
    } catch {
      setError('Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center px-5 py-6 gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-brand-500" />
        </div>
        <h1 className="text-base font-semibold text-foreground">Welcome to NullThreat</h1>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Enter your VirusTotal API key to start scanning PDF downloads automatically.
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border focus-within:border-brand-500 transition-colors">
          <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Paste your API key here"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
          />
          <button
            onClick={() => setShow(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {show
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />
            }
          </button>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !key.trim()}
          className={cn(
            'w-full py-2 rounded-lg text-sm font-medium transition-all',
            'bg-brand-500 text-white hover:bg-brand-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saving ? 'Saving...' : 'Save API Key'}
        </button>
      </div>

      <a
        href="https://www.virustotal.com/gui/join-us"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-500 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Get a free VirusTotal API key
      </a>
    </div>
  )
}