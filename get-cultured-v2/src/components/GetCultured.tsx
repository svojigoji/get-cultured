'use client'

import { useEffect, useRef, useState } from 'react'

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

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

// ─── Landing ──────────────────────────────────────────────────────

function Landing({
  onGetCultured,
  loading,
  leaving,
}: {
  onGetCultured: () => void
  loading: boolean
  leaving: boolean
}) {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center min-h-screen bg-paper px-6 text-center"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 1, 1), transform 0.5s cubic-bezier(0.4, 0, 1, 1)',
      }}
    >
      <p
        className="anim-fade-up label text-dust mb-10 tracking-widest"
        style={{ animationDelay: '0.15s' }}
        aria-hidden="true"
      >
        A cultural discovery engine
      </p>

      <h1
        suppressHydrationWarning={true}
        className="anim-fade-up font-heading text-ink text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tighter max-w-2xl mb-14"
        style={{ animationDelay: '0.4s' }}
      >
        The world is <span className="italic">stranger</span>{' '}than you think.
      </h1>

      <button
        onClick={onGetCultured}
        disabled={loading}
        suppressHydrationWarning={true}
        className="
          anim-fade-up
          font-heading text-lg tracking-tight
          bg-ink text-paper-light
          px-10 py-4
          border border-ink
          transition-[colors,transform] duration-200
          hover:bg-ink-soft hover:border-ink-soft
          active:scale-[0.98]
          disabled:opacity-50
          cursor-pointer disabled:cursor-wait
        "
        style={{ animationDelay: '0.65s' }}
      >
        {loading ? 'Finding something…' : 'Get Cultured'}
      </button>

      <p
        className="anim-fade-up label text-dust mt-16 tracking-widest opacity-50 text-xs"
        style={{ animationDelay: '0.85s' }}
      >
        Press the button. See what happens.
      </p>
    </main>
  )
}

// ─── Post ─────────────────────────────────────────────────────────

function Post({
  post,
  onAgain,
  onBack,
  loading,
}: {
  post: Post
  onAgain: () => void
  onBack: () => void
  loading: boolean
}) {
  const cursorRef      = useRef<HTMLDivElement>(null)
  const cursorShown    = useRef(false)
  const [cursorBig, setCursorBig]       = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [visible, setVisible]           = useState(false)

  useEffect(() => {
    // Respect reduced-motion: show instantly, skip transition
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setVisible(true)
      return
    }
    const t = setTimeout(() => setVisible(true), 20)

    // Hide the system cursor
    document.body.style.cursor = 'none'

    const onMove = (e: MouseEvent) => {
      if (!cursorRef.current) return
      // Show cursor on first move (state so it survives re-renders)
      if (!cursorShown.current) {
        cursorShown.current = true
        setCursorVisible(true)
      }
      cursorRef.current.style.left = e.clientX + 'px'
      cursorRef.current.style.top  = e.clientY + 'px'
    }
    window.addEventListener('mousemove', onMove)

    return () => {
      clearTimeout(t)
      window.removeEventListener('mousemove', onMove)
      document.body.style.cursor = ''
    }
  }, [])

  const hover = {
    onMouseEnter: () => setCursorBig(true),
    onMouseLeave: () => setCursorBig(false),
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: '#17100A',
        overflowY: 'auto',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0, 0, 0.2, 1) 0.15s',
      }}
    >
      {/* ── Custom cursor ── */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          width:  cursorBig ? 40 : 9,
          height: cursorBig ? 40 : 9,
          background: cursorBig ? '#8C6E2A' : '#7A3B10',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s cubic-bezier(0, 0, 0.2, 1), height 0.2s cubic-bezier(0, 0, 0.2, 1), background 0.2s ease',
          opacity: cursorVisible ? 1 : 0,
        }}
      />

      {/* ── Grain overlay ── */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 900, opacity: 0.07,
        backgroundImage: GRAIN,
      }} />

      {/* ── Vignette overlay ── */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 901,
        background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 50%, rgba(60,35,10,0.18) 100%)',
      }} />

      {/* ── Top nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.4rem 2rem',
        zIndex: 100,
        background: 'linear-gradient(to bottom, rgba(23,16,10,0.7) 0%, transparent 100%)',
      }}>
        <button className="post-bar-back" onClick={onBack} {...hover}>
          ← Get Cultured
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {post.pillar && (
            <span className="post-bar-tag gold">{post.pillar}</span>
          )}
          {post.region && (
            <span className="post-bar-tag">{post.region}</span>
          )}
        </div>

        <button className="post-bar-again" onClick={onAgain} disabled={loading} {...hover}>
          {loading ? '…' : 'Again →'}
        </button>
      </nav>

      {/* ── Video hero ── */}
      {post.videoId && (
        <div style={{
          position: 'relative', width: '100%',
          paddingBottom: 'min(56.25%, 56.25vw)',
          background: '#0a0704', flexShrink: 0,
        }}>
          <iframe
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            src={`https://www.youtube.com/embed/${post.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          {/* Fade into caption */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '30%', pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent, #17100A)',
          }} />
        </div>
      )}

      {/* ── Caption ── */}
      <div style={{
        background: '#17100A',
        padding: '2.8rem 2rem 5rem',
        maxWidth: 780, margin: '0 auto', width: '100%',
      }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem' }}>
          {post.pillar && (
            <span style={{
              fontFamily: 'var(--font-inconsolata)', fontSize: 10,
              letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8C6E2A',
            }}>
              {post.pillar}
            </span>
          )}
          {post.pillar && post.region && (
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(232,220,197,0.2)', display: 'inline-block', flexShrink: 0 }} />
          )}
          {post.region && (
            <span style={{
              fontFamily: 'var(--font-inconsolata)', fontSize: 10,
              letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,220,197,0.35)',
            }}>
              {post.region}
            </span>
          )}
        </div>

        {/* Title — last word italic gold */}
        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          fontWeight: 400,
          fontSize: 'clamp(28px, 4vw, 48px)',
          lineHeight: 1.08,
          letterSpacing: '-0.01em',
          color: '#E8DCC5',
          marginBottom: '1.2rem',
        }}>
          {(() => {
            const words = post.title.trim().split(' ')
            if (words.length < 2) return post.title
            const last = words.pop()!
            return (
              <>{words.join(' ')}{' '}
                <span style={{ fontStyle: 'italic', color: '#8C6E2A' }}>{last}</span>
              </>
            )
          })()}
        </h1>

        {/* Lede */}
        {post.lede && (
          <p style={{
            fontSize: 'clamp(15px, 1.7vw, 19px)',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'rgba(232,220,197,0.65)',
            borderLeft: '2px solid #7A3B10',
            paddingLeft: '1.2rem',
            marginBottom: '2rem',
          }}>
            {post.lede}
          </p>
        )}

        {/* Curator note */}
        {post.note && (
          <p style={{
            fontFamily: 'var(--font-inconsolata)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'rgba(232,220,197,0.3)',
            fontStyle: 'italic',
            marginBottom: '2.5rem',
          }}>
            ↑ {post.note}
          </p>
        )}

        {/* Rule */}
        <div style={{ width: '100%', height: 1, background: 'rgba(232,220,197,0.08)', margin: '0 0 2.5rem' }} />

        {/* Again */}
        <button className="post-again-btn" onClick={onAgain} disabled={loading} {...hover}>
          {loading ? 'Finding something…' : <>Get Cultured Again <span>→</span></>}
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────

export default function GetCultured() {
  const [view, setView]       = useState<'landing' | 'post'>('landing')
  const [post, setPost]       = useState<Post | null>(null)
  const [rows, setRows]       = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleGetCultured() {
    setLeaving(true)
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchRows()
      if (!fetched.length) throw new Error('No posts found in sheet.')
      setRows(fetched)
      setPost(pickRandom(fetched))
      setView('post')
    } catch (e) {
      setLeaving(false)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleAgain() {
    if (!rows.length) return
    setLoading(true)
    setTimeout(() => {
      setPost(pickRandom(rows, post ?? undefined))
      setLoading(false)
    }, 0)
  }

  function handleBack() {
    setView('landing')
    setPost(null)
    setLeaving(false)
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
    return <Post post={post} onAgain={handleAgain} onBack={handleBack} loading={loading} />
  }

  return <Landing onGetCultured={handleGetCultured} loading={loading} leaving={leaving} />
}
