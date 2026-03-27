const YT_API_KEY  = 'AIzaSyAHfpMauIr_K3hQkXzN-a8hvFHx1SWY_Yg'
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

  const prompt = `You are the content curator for "Get Cultured" — a site surfacing niche cultural discoveries from around the world through video.

A video has been submitted with this YouTube metadata:
Title: ${snippet.title}
Description: ${snippet.description ? snippet.description.slice(0, 600) : 'No description'}
Channel: ${snippet.channelTitle}

Generate content for this post. Respond ONLY with a valid JSON object, no markdown, no backticks:

{
  "title": "A short evocative post title in Get Cultured style — rewrite the YouTube title, do not copy it verbatim. No HTML tags.",
  "lede": "One or two sentences. Specific, curious, no fluff. This is all the viewer reads before watching.",
  "note": "One short line about what to watch or listen for in the video.",
  "pillar": "One of exactly: Sound, Taste, Make, Believe, Play, Speak",
  "region": "The geographic region or country this content is from",
  "type": "One of exactly: The Clip, The Gem, The Stack"
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

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const data = await res.json()
  const text = (data.content as { type: string; text: string }[])
    .map(b => b.text ?? '')
    .join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId || typeof videoId !== 'string') {
      return Response.json({ error: 'videoId is required' }, { status: 400 })
    }

    const snippet  = await fetchYouTubeMeta(videoId)
    const generated = await generateWithClaude(snippet)

    return Response.json(generated)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
