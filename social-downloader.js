const H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
const ok  = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: H })
const err = (msg, s = 400) => ok({ success: false, message: msg }, s)

const detect = u =>
  u.includes('tiktok') ? 'TikTok' :
  u.includes('x.com') ? 'X' :
  (u.includes('youtube.com') || u.includes('youtu.be')) ? 'YouTube' : null

addEventListener('fetch', e => e.respondWith(handle(e.request)))

async function handle(req) {
  const url = new URL(req.url)
  if (req.method !== 'GET') return err('Only GET requests are allowed')

  if (url.pathname === '/search') {
    const q = url.searchParams.get('query')?.trim()
    if (!q) return err('Query parameter is required')
    return await search(q)
  }

  if (url.pathname === '/tiktok-search') {
    const q = url.searchParams.get('query')?.trim()
    if (!q) return err('Query parameter is required')
    return await tiktokSearch(q)
  }

  if (url.pathname === '/download' || url.pathname === '/') {
    const u = url.searchParams.get('url')?.trim()
    if (!u) return err('The url parameter is required')

    const platform = detect(u)
    if (!platform) return err('Could not detect service')

    if (platform === 'YouTube') {
      const format = url.searchParams.get('format')?.toLowerCase()
      if (!format || !['mp4', 'mp3'].includes(format)) {
        return err('Format parameter required for YouTube (mp4 or mp3)')
      }
      return await YouTube(u, format)
    }

    return platform === 'TikTok' ? await TikTok(u) : await X(u)
  }

  return err('Endpoint not found. Use /download, /search or /tiktok-search', 404)
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

async function YouTube(u, format) {
  const apiUrl = `https://yout-tube-downloader-t.vercel.app/api/download?url=${encodeURIComponent(u)}&format=${format}`
  const r = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error()
  const d = await r.json()
  if (!d.ok) return err('Could not get YouTube download link')
  return ok({
    success: true,
    platform: 'YouTube',
    title: d.title,
    format: d.format,
    [format === 'mp3' ? 'audio_url' : 'video_url']: d.download_url
  })
}

async function search(query) {
  const r = await fetch(`https://yout-tube-downloader-t.vercel.app/api/search?query=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(30000)
  })
  if (!r.ok) throw new Error()
  const d = await r.json()
  if (!d.ok) return err('Search failed')
  return ok({ success: true, platform: 'YouTube', results: d.results })
}

async function tiktokSearch(query) {
  const r = await fetch(`https://tiktok-downloader-rouge.vercel.app/search?query=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(30000)
  })
  if (!r.ok) throw new Error()
  const d = await r.json()
  if (!d.success) return err('TikTok search failed')
  return ok({ success: true, platform: 'TikTok', results: d.results })
}
