const SAFE_PROTOCOLS = ['http:', 'https:']

export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? trimmed : null
  } catch {
    return null
  }
}

export function getGoogleSheetsEmbedUrl(url: string): string | null {
  const safe = sanitizeUrl(url)
  if (!safe || !safe.includes('docs.google.com/spreadsheets')) return null
  try {
    const parsed = new URL(safe)
    const parts = parsed.pathname.split('/')
    const dIdx = parts.indexOf('d')
    if (dIdx === -1 || !parts[dIdx + 1]) return null
    const sheetId = parts[dIdx + 1]
    const gid =
      parsed.hash.match(/gid=(\d+)/)?.[1] ?? parsed.searchParams.get('gid')
    return `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview${gid ? `?gid=${gid}` : ''}`
  } catch {
    return null
  }
}
