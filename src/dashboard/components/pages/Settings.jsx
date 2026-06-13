import { useState } from 'react'
import { Key, Trash2, Download, ExternalLink, CheckCircle, XCircle, Info } from 'lucide-react'
import { saveSettings, getSettings, getScanHistory } from '../../../storage/store.js'
import { cn } from '../../../lib/utils.js'

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-secondary/50">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        backgroundColor: checked ? '#22c55e' : '#3f3f46',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.2s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '24px' : '3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}


export default function Settings({ settings, updateSetting, clearHistory }) {
  const [editingKey, setEditingKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'ok' | 'fail'
  const [clearing, setClearing] = useState(false)

  const maskedKey = settings?.apiKey
    ? '••••••••' + settings.apiKey.slice(-4)
    : 'Not configured'

  async function handleSaveKey() {
    if (!newKey.trim()) return
    await saveSettings({ ...settings, apiKey: newKey.trim() })
    setEditingKey(false)
    setNewKey('')
  }

  async function handleTestKey() {
    setTestStatus('testing')
    try {
      const { apiKey } = await getSettings()
      const res = await fetch('https://www.virustotal.com/api/v3/files/275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f', {
        headers: { 'x-apikey': apiKey },
      })
      setTestStatus(res.status === 200 || res.status === 404 ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    }
    setTimeout(() => setTestStatus(null), 3000)
  }

  async function handleClearHistory() {
    setClearing(true)
    await clearHistory()
    setClearing(false)
  }

  function handleExportJSON() {
    getScanHistory().then(history => {
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nullthreat-history-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="p-6 flex flex-col gap-4 max-w-2xl">
      {/* API Configuration */}
      <Section title="API Configuration">
        <SettingRow
          label="VirusTotal API Key"
          description="Used to authenticate all scan requests"
        >
          {editingKey ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="Paste new API key"
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-brand-500 w-48"
              />
              <button
                onClick={handleSaveKey}
                className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingKey(false)}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{maskedKey}</span>
              <button
                onClick={() => setEditingKey(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </SettingRow>
        <SettingRow
          label="Test Connection"
          description="Verify your API key is valid and working"
        >
          <button
            onClick={handleTestKey}
            disabled={testStatus === 'testing'}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              testStatus === 'ok' && 'bg-brand-500/10 text-brand-500',
              testStatus === 'fail' && 'bg-destructive/10 text-destructive',
              !testStatus && 'bg-secondary border border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {testStatus === 'testing' && <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />}
            {testStatus === 'ok' && <CheckCircle className="w-3.5 h-3.5" />}
            {testStatus === 'fail' && <XCircle className="w-3.5 h-3.5" />}
            {testStatus === 'testing' ? 'Testing...' : testStatus === 'ok' ? 'Connected' : testStatus === 'fail' ? 'Failed' : 'Test API Key'}
          </button>
        </SettingRow>
      </Section>

      {/* Scan Preferences */}
      <Section title="Scan Preferences">
        <SettingRow
          label="Auto-scan downloads"
          description="Automatically scan PDF files when downloaded"
        >
          <Toggle
            checked={settings?.autoScan ?? true}
            onChange={v => updateSetting('autoScan', v)}
          />
        </SettingRow>
        <SettingRow
          label="Notify on threat only"
          description="Only show notifications when a threat is detected"
        >
          <Toggle
            checked={!(settings?.notifyOnClean ?? false)}
            onChange={v => updateSetting('notifyOnClean', !v)}
          />
        </SettingRow>
      </Section>

      {/* Data Management */}
      <Section title="Data Management">
        <SettingRow
          label="Export history"
          description="Download your scan history as JSON or CSV"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </SettingRow>
        <SettingRow
          label="Clear scan history"
          description="Permanently delete all scan records"
        >
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="About">
        <SettingRow label="Version" description="NullThreat Browser Extension">
          <span className="text-xs font-mono text-muted-foreground">v1.0.0</span>
        </SettingRow>
        <SettingRow label="Source Code" description="View the project on GitHub">
          <a
            href="https://github.com/Yessine05/NullThreat"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GitHub
          </a>
        </SettingRow>
        <SettingRow label="Powered by" description="Threat intelligence">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">VirusTotal API v3</span>
          </div>
        </SettingRow>
      </Section>
    </div>
  )
}