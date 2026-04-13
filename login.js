// pages/index.js
// ─────────────────────────────────────────────────────────────
// Main UI page. Handles:
//   - Reading the GitHub access token from the URL hash after OAuth
//   - Fetching the user's GitHub profile once logged in
//   - Form state for repo name, file name, and code
//   - Calling /api/push to create the repo and commit the code
//   - Displaying a success banner with the repo link
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Head from 'next/head'

// ── Small reusable icon components ───────────────────────────

function GitHubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────

export default function Home() {
  // ── State ─────────────────────────────────────────────────
  const [token,    setToken]    = useState('')      // GitHub OAuth access token
  const [user,     setUser]     = useState(null)    // GitHub user profile { login, avatar_url }
  const [repoName, setRepoName] = useState('')      // Desired repo name
  const [fileName, setFileName] = useState('')      // Optional override for file name
  const [code,     setCode]     = useState('')      // Pasted code
  const [loading,  setLoading]  = useState(false)   // Push-in-progress flag
  const [result,   setResult]   = useState(null)    // { repoUrl, repoName, fileName } on success
  const [error,    setError]    = useState('')      // Error message string

  // ── Read token from URL hash after OAuth redirect ─────────
  useEffect(() => {
    // URL format: http://localhost:3000/#token=gho_...
    const hash = window.location.hash  // e.g. "#token=gho_abc123"
    if (hash.startsWith('#token=')) {
      const extractedToken = hash.replace('#token=', '')
      setToken(extractedToken)

      // Clean the hash from the URL bar (cosmetic — keeps URL tidy)
      window.history.replaceState(null, '', '/')

      // Fetch user profile with the new token
      fetchUser(extractedToken)
    }
  }, [])

  // ── Fetch GitHub user profile ─────────────────────────────
  async function fetchUser(accessToken) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch {
      // Silently fail — user will just see "Connect GitHub" again
    }
  }

  // ── GitHub Login ──────────────────────────────────────────
  function handleGitHubLogin() {
    // Redirect to our API route which then redirects to GitHub
    window.location.href = '/api/auth/login'
  }

  // ── Logout ───────────────────────────────────────────────
  function handleLogout() {
    setToken('')
    setUser(null)
    setResult(null)
    setError('')
  }

  // ── Push code to GitHub ───────────────────────────────────
  async function handlePush() {
    setError('')
    setResult(null)

    // Basic validation
    if (!token) {
      setError('Please connect your GitHub account first.')
      return
    }
    if (!repoName.trim()) {
      setError('Please enter a repository name.')
      return
    }
    if (!code.trim()) {
      setError('Please paste some code before pushing.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          repoName: repoName.trim(),
          fileName: fileName.trim() || undefined,
          code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setResult(data)
        // Reset form after success
        setRepoName('')
        setFileName('')
        setCode('')
      }
    } catch {
      setError('Network error. Is the dev server running?')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>GitHub Pusher — paste & push</title>
        <meta name="description" content="Paste code and push it to GitHub in one click" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
      </Head>

      {/* ── Full-page background ─────────────────────────── */}
      <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col">

        {/* ── Header ──────────────────────────────────────── */}
        <header className="border-b border-terminal-border bg-terminal-surface">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h1 className="font-mono font-semibold text-sm text-terminal-text tracking-tight">
                  github-pusher
                </h1>
                <p className="text-xs text-terminal-muted">paste code → push to GitHub</p>
              </div>
            </div>

            {/* Auth state */}
            {user ? (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-7 h-7 rounded-full border border-terminal-border"
                />
                <span className="text-sm text-terminal-muted font-mono">
                  @{user.login}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-terminal-muted hover:text-terminal-text transition-colors px-2 py-1 rounded border border-terminal-border hover:border-terminal-muted"
                >
                  logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleGitHubLogin}
                className="relative overflow-hidden btn-shine flex items-center gap-2 px-4 py-2 rounded-md bg-[#21262d] border border-terminal-border hover:border-[#58a6ff55] hover:bg-[#30363d] transition-all text-sm font-medium"
              >
                <GitHubIcon size={16} />
                Connect GitHub
              </button>
            )}
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────── */}
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-6">

          {/* ── Success banner ──────────────────────────────── */}
          {result && (
            <div className="fade-slide-up glow-success flex items-start gap-4 p-5 rounded-lg border border-terminal-border bg-terminal-surface">
              <div className="mt-0.5 text-terminal-green flex-shrink-0">
                <CheckIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-terminal-green text-sm">
                  Repository created successfully!
                </p>
                <p className="text-terminal-muted text-xs mt-1 font-mono">
                  {result.repoName} / {result.fileName}
                </p>
                <a
                  href={result.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-terminal-accent text-sm hover:underline font-mono"
                >
                  {result.repoUrl}
                  <ExternalLinkIcon />
                </a>
              </div>
            </div>
          )}

          {/* ── Error banner ────────────────────────────────── */}
          {error && (
            <div className="fade-slide-up flex items-center gap-3 p-4 rounded-lg border border-red-900 bg-red-950/30 text-red-400 text-sm">
              <span className="flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          {/* ── Form card ───────────────────────────────────── */}
          <div className="rounded-xl border border-terminal-border bg-terminal-surface overflow-hidden">

            {/* Card header */}
            <div className="scanline border-b border-terminal-border px-6 py-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/70"/>
              <span className="w-3 h-3 rounded-full bg-yellow-500/70"/>
              <span className="w-3 h-3 rounded-full bg-terminal-greenDim"/>
              <span className="font-mono text-xs text-terminal-muted ml-2 select-none">
                new-repository.sh
              </span>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* ── Row: Repo name + File name ─────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-terminal-muted tracking-wider uppercase">
                    Repository name *
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="bg-terminal-bg border border-terminal-border rounded-md px-3 py-2 text-sm font-mono text-terminal-text placeholder-terminal-muted/50 focus:outline-none focus:border-terminal-accent transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-terminal-muted tracking-wider uppercase">
                    File name <span className="normal-case text-[10px]">(auto-detected)</span>
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    placeholder="index.js"
                    className="bg-terminal-bg border border-terminal-border rounded-md px-3 py-2 text-sm font-mono text-terminal-text placeholder-terminal-muted/50 focus:outline-none focus:border-terminal-accent transition-colors"
                  />
                </div>
              </div>

              {/* ── Code textarea ─────────────────────────── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-terminal-muted tracking-wider uppercase">
                  Paste your code *
                </label>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder={'// Paste your code here...\n\nconsole.log("Hello, GitHub! 🚀")'}
                  className="code-area w-full bg-terminal-bg border border-terminal-border rounded-md px-4 py-3 text-terminal-text placeholder-terminal-muted/40 focus:outline-none focus:border-terminal-accent transition-colors"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {/* Character count */}
                {code && (
                  <p className="text-right text-[11px] text-terminal-muted font-mono">
                    {code.length.toLocaleString()} chars · {code.split('\n').length} lines
                  </p>
                )}
              </div>

              {/* ── Actions ───────────────────────────────── */}
              <div className="flex items-center gap-3 pt-1">

                {/* Push button */}
                <button
                  onClick={handlePush}
                  disabled={loading || !token}
                  className={`
                    relative overflow-hidden btn-shine flex items-center justify-center gap-2
                    flex-1 py-2.5 rounded-md font-semibold text-sm transition-all
                    ${token
                      ? 'bg-terminal-greenDim hover:bg-[#2ea043] text-white cursor-pointer'
                      : 'bg-terminal-surface border border-terminal-border text-terminal-muted cursor-not-allowed'}
                    ${loading ? 'opacity-70 cursor-wait' : ''}
                  `}
                >
                  {loading ? (
                    <>
                      <span className="spinner"/>
                      Pushing…
                    </>
                  ) : (
                    <>
                      <GitHubIcon size={15} />
                      Create Repo &amp; Push Code
                    </>
                  )}
                </button>

                {/* Connect button (shown again inline if not logged in) */}
                {!token && (
                  <button
                    onClick={handleGitHubLogin}
                    className="relative overflow-hidden btn-shine flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#21262d] border border-terminal-border hover:border-[#58a6ff55] hover:bg-[#30363d] transition-all text-sm font-medium whitespace-nowrap"
                  >
                    <GitHubIcon size={15} />
                    Connect GitHub first
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── How it works ────────────────────────────────── */}
          <div className="rounded-xl border border-terminal-border bg-terminal-surface p-6">
            <h2 className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-4">
              How it works
            </h2>
            <ol className="space-y-3">
              {[
                ['01', 'Click "Connect GitHub" — you\'ll be redirected to authorize the app.'],
                ['02', 'Paste your code into the editor above.'],
                ['03', 'Give the repo a name (no spaces — hyphens are fine).'],
                ['04', 'Optionally set a file name; otherwise it\'s auto-detected from your code.'],
                ['05', 'Click "Create Repo & Push Code" — done in seconds! 🎉'],
              ].map(([num, text]) => (
                <li key={num} className="flex items-start gap-3 text-sm">
                  <span className="font-mono text-terminal-green text-xs mt-0.5 flex-shrink-0">{num}</span>
                  <span className="text-terminal-muted">{text}</span>
                </li>
              ))}
            </ol>
          </div>

        </main>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="border-t border-terminal-border py-5 text-center">
          <p className="text-xs text-terminal-muted font-mono">
            github-pusher — uses GitHub OAuth &amp; REST API · tokens never stored server-side
          </p>
        </footer>
      </div>
    </>
  )
}
