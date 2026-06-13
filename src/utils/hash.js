export async function sha256FromBlob(blob) {
  const buffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256FromUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return sha256FromBlob(blob)
}