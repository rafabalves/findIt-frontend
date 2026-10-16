const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function labelGuidFromQr(value: string): string | null {
  const text = value.trim()
  if (guidPattern.test(text)) return text.toLowerCase()
  try {
    const url = new URL(text)
    const path = url.pathname.split('/').filter(Boolean)
    if (!['http:', 'https:'].includes(url.protocol) || path.length !== 2 || path[0] !== 'qr') return null
    return guidPattern.test(path[1]) ? path[1].toLowerCase() : null
  } catch {
    return null
  }
}
