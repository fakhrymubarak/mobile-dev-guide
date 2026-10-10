import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

export const LEARN_PAGES = [
  { to: '/learn', key: 'nav.intro', end: true },
  { to: '/learn/lifecycle', key: 'nav.lifecycle' },
  { to: '/learn/building-blocks', key: 'nav.blocks' },
  { to: '/learn/toolchain', key: 'nav.toolchain' },
  { to: '/learn/widgets', key: 'nav.widgets' },
  { to: '/learn/foldables', key: 'nav.foldables' },
  { to: '/learn/cheatsheet', key: 'nav.cheatsheet' },
]

export function LearnLayout() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-6 pb-20 lg:flex-row">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-20 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:self-start lg:px-0">
        {LEARN_PAGES.map((p) => (
          <NavLink
            key={p.to}
            to={p.to}
            end={p.end}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            {t(p.key)}
          </NavLink>
        ))}
      </nav>
      <article className="min-w-0 flex-1">
        <Outlet />
      </article>
    </div>
  )
}

export function PageHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{lead}</p>
    </header>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xl font-bold tracking-tight">{children}</h2>
}

/** i18n helper for array/object values (tables, lists). */
export function useList<T>(key: string): T[] {
  const { t } = useTranslation()
  const v = t(key, { returnObjects: true }) as unknown
  return Array.isArray(v) ? (v as T[]) : []
}
