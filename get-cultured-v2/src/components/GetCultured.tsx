'use client'

import { useState } from 'react'

type Post = {
  title: string
  lede: string
  pillar: string
  region: string
  videoId: string
  note: string
  type: string
}

async function fetchRows(): Promise<Post[]> {
  const res = await fetch('/api/posts')
  if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`)
  return res.json()
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  if (arr.length === 1) return arr[0]
  const filtered = exclude ? arr.filter((x) => x !== exclude) : arr
  return filtered[Math.floor(Math.random() * filtered.length)]
}

// ─── Landing ──────────────────────────────────────────────────────

function Landing({
  onGetCultured,
  loading,
}: {
  onGetCultured: () => void
  loading: boolean
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-paper px-6 text-center">
      <p className="label text-dust mb-10 tracking-widest" aria-hidden="true">
        A cultural discovery engine
      </p>

      <h1 suppressHydrationWarning={true} className="font-heading text-ink text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tighter max-w-2xl mb-14">
        The world is <span className="italic">stranger</span>{' '}than you think.
      </h1>

      <button
        onClick={onGetCultured}
        disabled={loading}
        suppressHydrationWarning={true}
        className="
          font-heading text-lg tracking-tight
          bg-ink text-paper-light
          px-10 py-4
          border border-ink
          transition-colors duration-200
          hover:bg-ink-soft hover:border-ink-soft
          active:scale-[0.98]
          disabled:opacity-50
          cursor-pointer disabled:cursor-wait
        "
      >
        {loading ? 'Finding something…' : 'Get Cultured'}
      </button>

      <p className="label text-dust mt-16 tracking-widest opacity-50 text-xs">
        Press the button. See what happens.
      </p>
    </main>
  )
}

// ─── Post ─────────────────────────────────────────────────────────

function Post({
  post,
  onAgain,
  loading,
}: {
  post: Post
  onAgain: () => void
  loading: boolean
}) {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 flex flex-col items-center">
      <article className="w-full max-w-2xl flex flex-col gap-8">

        {/* Pillar + region labels */}
        <div className="flex items-center gap-3">
          {post.pillar && (
            <span className="label text-saddle">{post.pillar}</span>
          )}
          {post.pillar && post.region && (
            <span className="label text-dust">·</span>
          )}
          {post.region && (
            <span className="label text-dust">{post.region}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-ink text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Gold rule */}
        <div className="h-px bg-gold opacity-40 w-16" />

        {/* Lede */}
        {post.lede && (
          <p className="font-serif text-ink-soft text-lg leading-relaxed">
            {post.lede}
          </p>
        )}

        {/* YouTube embed */}
        {post.videoId && (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${post.videoId}`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Curator note */}
        {post.note && (
          <p className="font-serif italic text-dust text-sm leading-relaxed border-l-2 border-gold pl-4">
            {post.note}
          </p>
        )}

        {/* Again button */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={onAgain}
            disabled={loading}
            className="
              font-heading text-lg tracking-tight
              bg-ink text-paper-light
              px-10 py-4
              border border-ink
              transition-colors duration-200
              hover:bg-ink-soft hover:border-ink-soft
              active:scale-[0.98]
              disabled:opacity-50
              cursor-pointer disabled:cursor-wait
            "
          >
            {loading ? 'Finding something…' : 'Again →'}
          </button>
        </div>
      </article>
    </main>
  )
}

// ─── Root ─────────────────────────────────────────────────────────

export default function GetCultured() {
  const [view, setView]     = useState<'landing' | 'post'>('landing')
  const [post, setPost]     = useState<Post | null>(null)
  const [rows, setRows]     = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleGetCultured() {
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchRows()
      if (!fetched.length) throw new Error('No posts found in sheet.')
      setRows(fetched)
      setPost(pickRandom(fetched))
      setView('post')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleAgain() {
    if (!rows.length) return
    setLoading(true)
    // Defer so the disabled state renders before the synchronous work
    setTimeout(() => {
      setPost(pickRandom(rows, post ?? undefined))
      setLoading(false)
    }, 0)
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-paper px-6 text-center gap-6">
        <p className="label text-saddle tracking-widest">Something went wrong</p>
        <p className="font-serif text-ink-soft">{error}</p>
        <button
          onClick={() => { setError(null); setView('landing') }}
          className="label text-dust underline underline-offset-4 cursor-pointer"
        >
          Go back
        </button>
      </main>
    )
  }

  if (view === 'post' && post) {
    return <Post post={post} onAgain={handleAgain} loading={loading} />
  }

  return <Landing onGetCultured={handleGetCultured} loading={loading} />
}
