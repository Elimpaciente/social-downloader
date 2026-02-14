const H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
const ok  = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: H })
const err = (msg, s = 400) => ok({ success: false, message: msg }, s)

const detect = u =>
  u.includes('tiktok') ? 'TikTok' :
  u.includes('x.com') ? 'X' : null

addEventListener('fetch', e => e.respondWith(handle(e.request)))

async function handle(req) {
  const url = new URL(req.url)
  if (req.method !== 'GET') return err('Only GET requests are allowed')

  const u = url.searchParams.get('url')?.trim()
  if (!u) return err('The url parameter is required')

  const platform = detect(u)
  if (!platform) return err('Could not detect service')

  try {
    return platform === 'TikTok' ? await TikTok(u) : await X(u)
  } catch {
    return err('Error processing request', 500)
  }
}

async function TikTok(u) {
  const r = await fetch(`https://tiktok-downloader-rouge.vercel.app/download?url=${encodeURIComponent(u)}`, {
    signal: AbortSignal.timeout(30000)
  })
  if (!r.ok) throw new Error()
  const d = await r.json()
  if (!d.success) return err('Could not get TikTok links')
  return ok({ success: true, platform: 'TikTok', video_url: d.video, audio_url: d.audio })
}

async function X(u) {
  const r = await fetch(`https://x-downloader-nine.vercel.app/download?url=${encodeURIComponent(u)}`, {
    signal: AbortSignal.timeout(30000)
  })
  if (!r.ok) throw new Error()
  const d = await r.json()
  if (!d.success) return err('Could not get X media link')
  return ok({ success: true, platform: 'X', type: d.type, url: d.url })
}
