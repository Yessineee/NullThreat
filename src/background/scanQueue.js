const REQUESTS_PER_MINUTE = 4
const INTERVAL_MS = 60000 / REQUESTS_PER_MINUTE // 15s between requests

let queue = []
let processing = false
let lastRequestTime = 0

export function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    if (!processing) processQueue()
  })
}

async function processQueue() {
  if (queue.length === 0) {
    processing = false
    return
  }

  processing = true
  const now = Date.now()
  const timeSinceLast = now - lastRequestTime
  const waitTime = Math.max(0, INTERVAL_MS - timeSinceLast)

  if (waitTime > 0) {
    await sleep(waitTime)
  }

  const { task, resolve, reject } = queue.shift()

  try {
    lastRequestTime = Date.now()
    const result = await task()
    resolve(result)
  } catch (err) {
    reject(err)
  }

  processQueue()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}