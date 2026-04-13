// pages/api/push.js
// ─────────────────────────────────────────────────────────────
// Core logic: creates a GitHub repo and commits the pasted code.
//
// Flow:
//   1. Get the authenticated user's GitHub username
//   2. Create a new public repository
//   3. Detect the file extension based on the code content
//   4. Create a file in the repo with the pasted code (base64-encoded)
//   5. Return the new repo URL to the frontend
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const { token, repoName, code, fileName } = req.body

  // ── Validate inputs ───────────────────────────────────────
  if (!token)    return res.status(400).json({ error: 'Missing GitHub access token.' })
  if (!repoName) return res.status(400).json({ error: 'Missing repository name.' })
  if (!code)     return res.status(400).json({ error: 'No code provided.' })

  // Sanitize repo name: GitHub only allows alphanumerics, hyphens, underscores, dots
  const sanitizedName = repoName.trim().replace(/[^a-zA-Z0-9._-]/g, '-')

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    // ── Step 1: Get authenticated user info ───────────────────
    const userRes = await fetch('https://api.github.com/user', { headers })
    if (!userRes.ok) {
      const err = await userRes.json()
      return res.status(401).json({ error: `GitHub auth failed: ${err.message}` })
    }
    const user = await userRes.json()
    const username = user.login  // e.g. "octocat"

    // ── Step 2: Create the repository ────────────────────────
    const repoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name:        sanitizedName,
        description: 'Created with GitHub Pusher 🚀',
        private:     false,   // public repo — change to true if you want private
        auto_init:   false,   // we'll push our own file, no README needed
      }),
    })

    if (!repoRes.ok) {
      const err = await repoRes.json()
      return res.status(400).json({
        error: `Failed to create repo: ${err.message}`,
      })
    }

    const repo = await repoRes.json()

    // ── Step 3: Determine the filename ───────────────────────
    // Use the caller-supplied fileName, or fall back to smart detection
    const detectedName = fileName?.trim() || detectFileName(code)

    // ── Step 4: Commit the code as a file ────────────────────
    // GitHub's "create file" API requires the content to be base64-encoded.
    const encodedContent = Buffer.from(code).toString('base64')

    const fileRes = await fetch(
      `https://api.github.com/repos/${username}/${sanitizedName}/contents/${detectedName}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Initial commit via GitHub Pusher 🚀',
          content: encodedContent,
        }),
      }
    )

    if (!fileRes.ok) {
      const err = await fileRes.json()
      return res.status(400).json({
        error: `Failed to push file: ${err.message}`,
      })
    }

    // ── Done! Return the repo URL ─────────────────────────────
    return res.status(200).json({
      success:  true,
      repoUrl:  repo.html_url,
      repoName: repo.full_name,
      fileName: detectedName,
    })

  } catch (err) {
    console.error('Push API error:', err)
    return res.status(500).json({ error: 'Internal server error. Check server logs.' })
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: guess file extension from code content
// ─────────────────────────────────────────────────────────────
function detectFileName(code) {
  const c = code.trim()

  if (c.startsWith('<!DOCTYPE') || c.startsWith('<html'))   return 'index.html'
  if (c.includes('import React') || c.includes('jsx'))       return 'App.jsx'
  if (c.includes('def ') && c.includes(':'))                 return 'main.py'
  if (c.includes('fn main()') || c.includes('println!'))    return 'main.rs'
  if (c.includes('package main') && c.includes('func'))     return 'main.go'
  if (c.includes('#include') && c.includes('int main'))     return 'main.cpp'
  if (c.includes('public class') || c.includes('System.out')) return 'Main.java'
  if (c.startsWith('<?php'))                                 return 'index.php'
  if (c.includes('SELECT') || c.includes('CREATE TABLE'))   return 'query.sql'
  if (c.includes('function') || c.includes('=>') || c.includes('const ')) return 'index.js'

  // Default fallback
  return 'code.txt'
}
