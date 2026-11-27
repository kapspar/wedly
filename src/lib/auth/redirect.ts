export function safeRedirect(value: string | null) {
  const base = 'https://planwedly.invalid'
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\') ||
      Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    return '/dashboard'
  }
  try {
    const parsed = new URL(value, base)
    return parsed.origin === base && !parsed.pathname.startsWith('//') ? parsed.pathname + parsed.search + parsed.hash : '/dashboard'
  } catch {
    return '/dashboard'
  }
}
