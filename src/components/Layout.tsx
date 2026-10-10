import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ExplainerProvider } from './Explainer'

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  }, [dark])
  return [dark, setDark] as const
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function Layout() {
  const { t, i18n } = useTranslation()
  const [dark, setDark] = useTheme()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  }, [i18n.resolvedLanguage])

  return (
    <ExplainerProvider>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5">
            <Link to="/" className="mr-2 flex items-center gap-2 font-bold tracking-tight">
              <Logo />
              <span className="hidden sm:inline">{t('site.title')}</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navCls}>
                {t('nav.playground')}
              </NavLink>
              <NavLink to="/learn" className={navCls}>
                {t('nav.learn')}
              </NavLink>
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === 'id' ? 'en' : 'id')}
                className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={t('lang.toggle')}
                title={t('lang.toggle')}
              >
                <span className={i18n.resolvedLanguage === 'en' ? 'text-slate-900 dark:text-white' : 'opacity-50'}>EN</span>
                <span className="mx-1 opacity-30">/</span>
                <span className={i18n.resolvedLanguage === 'id' ? 'text-slate-900 dark:text-white' : 'opacity-50'}>ID</span>
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={t('theme.toggle')}
                title={t('theme.toggle')}
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </ExplainerProvider>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <rect x="8" y="2" width="16" height="28" rx="4" className="fill-slate-900 dark:fill-white" />
      <rect x="10" y="5" width="6" height="20" rx="1.5" fill="#3ddc84" />
      <rect x="16" y="5" width="6" height="20" rx="1.5" fill="#0a84ff" />
    </svg>
  )
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)
