import type { Platform } from '../engine'

export function PlatformBadge({ platform, className = '' }: { platform: Platform; className?: string }) {
  return platform === 'android' ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-droid/15 px-2 py-0.5 text-xs font-semibold text-droid-ink dark:text-droid ${className}`}>
      <AndroidGlyph className="h-3.5 w-3.5" /> Android
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full bg-apple/15 px-2 py-0.5 text-xs font-semibold text-apple-ink dark:text-apple ${className}`}>
      <AppleGlyph className="h-3.5 w-3.5" /> iOS
    </span>
  )
}

export function AndroidGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M6 18a1 1 0 0 0 1 1h1v3.5a1.5 1.5 0 0 0 3 0V19h2v3.5a1.5 1.5 0 0 0 3 0V19h1a1 1 0 0 0 1-1V8H6zM3.5 8A1.5 1.5 0 0 0 2 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 3.5 8m17 0A1.5 1.5 0 0 0 19 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 20.5 8M15.5 2.2l1.3-1.3a.5.5 0 0 0-.7-.7l-1.5 1.5A6 6 0 0 0 12 1a6 6 0 0 0-2.6.6L7.9.2a.5.5 0 0 0-.7.7l1.3 1.3A5.9 5.9 0 0 0 6 7h12a5.9 5.9 0 0 0-2.5-4.8M10 5H9V4h1zm5 0h-1V4h1z" />
    </svg>
  )
}

export function AppleGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.5.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-4.1M13.9 4.9c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4" />
    </svg>
  )
}
