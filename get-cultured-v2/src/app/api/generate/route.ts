const YT_API_KEY   = 'AIzaSyAHfpMauIr_K3hQkXzN-a8hvFHx1SWY_Yg'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

async function fetchYouTubeMeta(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
  const data = await res.json()
  if (!data.items?.length) throw new Error('Video not found')
  return data.items[0].snippet as { title: string; description: string; channelTitle: string }
}

async function generateWithClaude(snippet: { title: string; description: string; channelTitle: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const prompt = `You are the editorial voice of "Get Cultured" — a curation site that surfaces niche cultural discoveries from around the world through video. The tone is curious, specific, and never generic. You write like a well-traveled editor who finds ordinary things extraordinary and extraordinary things ordinary. Every word earns its place.

A video has been submitted with this YouTube metadata:
Title: ${snippet.title}
Description: ${snippet.description ? snippet.description.slice(0, 800) : 'No description'}
Channel: ${snippet.channelTitle}

Generate editorial content for this post. Rules:
- The title must be rewritten in Get Cultured style — evocative, surprising, specific. Never copy the YouTube title verbatim. No HTML tags.
- The lede is one or two sentences maximum. It must make the reader feel they are about to discover something they have never seen before. No filler phrases like "explore", "discover", "dive into", "take a look". Be concrete.
- The note is one short observational line — what to watch or listen for. It should feel like a whisper from someone who has already seen it.
- The pillar must be exactly one of: Sound, Taste, Make, Believe, Play, Speak
- The region is the specific country or geographic region the content originates from. Be precise — not "Asia" but "Okinawa, Japan".
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

const CORS = {
  'Access-Control-Allow-Origin':  'https://svojigoji.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId || typeof videoId !== 'string') {
      return Response.json({ error: 'videoId is required' }, { status: 400, headers: CORS })
    }

    const snippet   = await fetchYouTubeMeta(videoId)
    const generated = await generateWithClaude(snippet)

    return Response.json({ ...generated, videoId }, { headers: CORS })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500, headers: CORS })
  }
}
