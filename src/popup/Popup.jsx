import { sha256FromBlob } from '../utils/hash.js'
import { scanByHash } from '../background/vtClient.js'
import { saveSettings } from '../storage/store.js'

export default function Popup() {
  async function seedApiKey() {
    await saveSettings({ apiKey: import.meta.env.VITE_VT_API_KEY })
    console.log('API key saved')
  }

  async function testScan(e) {
    const file = e.target.files[0]
    if (!file) return
    console.log('Hashing...')
    const hash = await sha256FromBlob(file)
    console.log('Hash:', hash)
    console.log('Querying VirusTotal...')
    const result = await scanByHash(hash)
    console.log('Result:', result)
  }

  return (
    <div className="dark bg-background text-foreground p-4 w-[380px] flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">NullThreat 🛡️</p>
      <button
        className="bg-brand-500 text-white text-sm px-3 py-1 rounded"
        onClick={seedApiKey}
      >
        Save API Key
      </button>
      <input type="file" accept=".pdf" onChange={testScan} />
    </div>
  )
}