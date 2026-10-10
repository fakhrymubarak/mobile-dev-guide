const PATHS: Record<string, string> = {
  power: 'M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0',
  rotate: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4',
  back: 'M15 5l-7 7 7 7',
  home: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  recents: 'M5 5h14v14H5z',
  memory: 'M7 4h10v16H7zM4 8h3M4 12h3M4 16h3M17 8h3M17 12h3M17 16h3M10 8h4v8h-4z',
  closed: 'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  half: 'M4 6l8 3v12l-8-3zM12 9l8-3v12l-8 3',
  open: 'M3 5h18v14H3zM12 5v14',
  window: 'M3 5h18v14H3zM12 5v14M15 9h3M15 12h3',
  closeWindow: 'M3 5h18v14H3zM14 10l4 4M18 10l-4 4',
  switcher: 'M3 7h4v10H3zM10 4h4v16h-4zM17 7h4v10h-4z',
  control: 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM16 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  dialog: 'M4 6h16v10H8l-4 4zM8 10h8',
  swipe: 'M12 19V5M7 10l5-5 5 5',
  plus: 'M12 5v14M5 12h14',
  detail: 'M9 6l6 6-6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
}

export function Icon({ name, className = 'h-4 w-4' }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}
