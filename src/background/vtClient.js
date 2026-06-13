import { getSettings } from '../storage/store.js'

const VT_BASE = 'https://www.virustotal.com/api/v3'

export async function scanByHash(hash) {
  const { apiKey } = await getSettings()
  if (!apiKey) throw new Error('No API key configured')

  const res = await fetch(`${VT_BASE}/files/${hash}`, {
    headers: { 'x-apikey': apiKey },
  })

  if (res.status === 404) {
    return { status: 'unknown', threatScore: 0, malicious: 0, total: 0, engines: {} }
  }
  if (!res.ok) throw new Error(`VT error: ${res.status}`)

  const data = await res.json()
  const stats = data.data.attributes.last_analysis_stats
  const results = data.data.attributes.last_analysis_results
  const malicious = stats.malicious || 0
  const total = Object.keys(results).length
  const threatScore = total > 0 ? Math.round((malicious / total) * 100) : 0

  return {
    status: malicious > 0 ? 'threat' : 'clean',
    threatScore,
    malicious,
    total,
    engines: results,
  }
}


export async function scanByUrl(url) {
  const { apiKey } = await getSettings()
  if (!apiKey) throw new Error('No API key configured')

  // First submit the URL for scanning
  const formData = new FormData()
  formData.append('url', url)

  const submitRes = await fetch(`${VT_BASE}/urls`, {
    method: 'POST',
    headers: { 'x-apikey': apiKey },
    body: formData,
  })

  if (!submitRes.ok) throw new Error(`VT submit error: ${submitRes.status}`)

  const submitData = await submitRes.json()
  const analysisId = submitData.data.id

  // Poll for result
  return await pollAnalysis(analysisId, apiKey)
}

async function pollAnalysis(analysisId, apiKey) {
  const maxAttempts = 20
  const delayMs = 8000

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(delayMs)

    const res = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
      headers: { 'x-apikey': apiKey },
    })

    if (!res.ok) continue

    const data = await res.json()
    const status = data.data.attributes.status

    if (status !== 'completed') {
      console.log(`Analysis pending... attempt ${i + 1}`)
      continue
    }

    const stats = data.data.attributes.stats
    const results = data.data.attributes.results
    const malicious = stats.malicious || 0
    const total = Object.keys(results).length
    const threatScore = total > 0 ? Math.round((malicious / total) * 100) : 0

    return {
      status: malicious > 0 ? 'threat' : 'clean',
      threatScore,
      malicious,
      total,
      engines: results,
    }
  }

  return { status: 'unknown', threatScore: 0, malicious: 0, total: 0, engines: {} }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}