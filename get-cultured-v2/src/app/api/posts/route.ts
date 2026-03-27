const SHEET_ID = '1KW9ZMsuzqGctHmUVLBuerAbA5XU5nZ9z4LHgNxNh5n0'
const API_KEY  = 'AIzaSyAHfpMauIr_K3hQkXzN-a8hvFHx1SWY_Yg'
const COLUMNS  = ['title', 'lede', 'pillar', 'region', 'videoId', 'note', 'type'] as const

export async function GET() {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/get-cultured-content!A:G` +
    `?key=${API_KEY}`

  console.log('[/api/posts] fetching:', url)

  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/posts] error response:', body)
    return Response.json(
      { error: `Sheets API error: ${res.status}`, detail: body },
      { status: res.status }
    )
  }

  const json = await res.json()
  const [, ...dataRows]: string[][] = json.values ?? []

  const posts = dataRows.map((row) =>
    Object.fromEntries(COLUMNS.map((col, i) => [col, row[i] ?? '']))
  )

  return Response.json(posts)
}
