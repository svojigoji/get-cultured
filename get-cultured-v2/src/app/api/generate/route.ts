const CLAUDE_MODEL = 'claude-sonnet-4-6'

// ─── Rate limiting (in-memory, per-IP, max 10 req/min) ────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT     = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now >= record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT) return false

  record.count++
  return true
}

// ─── Input validation ─────────────────────────────────────────────

// YouTube video IDs are exactly 11 characters: alphanumeric, hyphens, underscores
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/

// ─── YouTube metadata ─────────────────────────────────────────────

async function fetchYouTubeMeta(videoId: string) {
  const apiKey = process.env.YT_API_KEY
  if (!apiKey) throw new Error('YT_API_KEY is not set')

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
  const res = await fetch(url, { headers: { Referer: 'https://get-cultured.vercel.app' } })
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
  const data = await res.json()
  if (!data.items?.length) throw new Error('Video not found')
  return data.items[0].snippet as { title: string; description: string; channelTitle: string }
}

// ─── Claude generation ────────────────────────────────────────────

async function generateWithClaude(snippet: { title: string; description: string; channelTitle: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const prompt = `You are the editorial voice of "Get Cultured" — a curation site dedicated to the world's strangest, most obscure, and most niche sports. You write sport-focused editorial copy with the tone of a seasoned correspondent who has been ringside at the world cheese-rolling championship and covered competitive dog surfing with complete journalistic sincerity. Specific, dry, and never generic. Every word earns its place.

A video has been submitted with this YouTube metadata:
Title: ${snippet.title}
Description: ${snippet.description ? snippet.description.slice(0, 800) : 'No description'}
Channel: ${snippet.channelTitle}

Generate editorial content for this post. Rules:
- The title must be rewritten in Get Cultured style — evocative, surprising, sport-specific. Never copy the YouTube title verbatim. No HTML tags.
- The lede is one or two sentences maximum. Write about the sport itself — its rules, its culture, its athletes, its absurdity. Make the reader feel they are about to witness something they cannot explain to anyone who wasn't there. No filler phrases like "explore", "discover", "dive into", "take a look". Be concrete.
- The note is one short observational line — a detail about the sport or the competitors worth watching for. It should feel like a whisper from the only person in the press box who actually understands what's happening.
- The pillar must be exactly one of: Niche, Obscure, What on Earth Am I Watching
  - Use "Niche" for sports with a dedicated subculture and serious competitors — unusual but internally coherent (e.g. sepak takraw, underwater hockey, competitive dog agility).
  - Use "Obscure" for sports that exist but most people have never heard of — genuine athletic endeavour, just forgotten or regional (e.g. bossaball, fierljeppen, kabaddi).
  - Use "What on Earth Am I Watching" for sports that defy explanation — where the premise itself is the spectacle (e.g. cheese rolling, wife carrying, competitive air guitar).
- The region is the specific country or geographic region the sport originates from or is most associated with. Be precise — not "Asia" but "Okinawa, Japan".
- The type must be exactly one of: The Clip, The Gem, The Stack

Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:

{
  "title": "...",
  "lede": "...",
  "note": "...",
  "pillar": "...",
  "region": "...",
  "type": "..."
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error: ${res.status} — ${body}`)
  }

  const data = await res.json()
  const text = (data.content as { type: string; text: string }[])
    .map(b => b.text ?? '')
    .join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ─── CORS ─────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  'https://svojigoji.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

// ─── POST handler ─────────────────────────────────────────────────

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429, headers: CORS }
    )
  }

  try {
    const body = await request.json()
    const { videoId } = body

    // Validate videoId format: exactly 11 chars, YouTube-safe alphabet
    if (!videoId || !YOUTUBE_ID_RE.test(videoId)) {
      return Response.json(
        { error: 'Invalid videoId. Must be an 11-character YouTube video ID.' },
        { status: 400, headers: CORS }
      )
    }

    const snippet   = await fetchYouTubeMeta(videoId)
    const generated = await generateWithClaude(snippet)

    return Response.json({ ...generated, videoId }, { headers: CORS })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500, headers: CORS })
  }
}
