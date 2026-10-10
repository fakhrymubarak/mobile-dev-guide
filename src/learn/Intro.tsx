import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Card, H2, PageHeader, useList } from './LearnLayout'

const CARDS = [
  { to: '/', title: 'nav.playground', body: 'intro.card.playground', icon: '📱' },
  { to: '/learn/lifecycle', title: 'nav.lifecycle', body: 'intro.card.lifecycle', icon: '🔄' },
  { to: '/learn/building-blocks', title: 'nav.blocks', body: 'intro.card.blocks', icon: '🧱' },
  { to: '/learn/toolchain', title: 'nav.toolchain', body: 'intro.card.toolchain', icon: '🛠️' },
  { to: '/learn/widgets', title: 'nav.widgets', body: 'intro.card.widgets', icon: '🎛️' },
  { to: '/learn/foldables', title: 'nav.foldables', body: 'intro.card.foldables', icon: '📖' },
  { to: '/learn/cheatsheet', title: 'nav.cheatsheet', body: 'intro.card.cheatsheet', icon: '🗒️' },
]

export function Intro() {
  const { t } = useTranslation()
  const why = useList<string>('intro.why.body')
  const rows = useList<{ name: string; lang: string; note: string }>('intro.native.rows')

  return (
    <>
      <PageHeader title={t('intro.title')} lead={t('intro.lead')} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <H2>{t('intro.why.title')}</H2>
          <ul className="space-y-2.5">
            {why.map((w, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                  {i + 1}
                </span>
                {w}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <H2>{t('intro.native.title')}</H2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r) => (
              <div key={r.name} className="py-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{r.name}</span>
                  <span className="font-mono text-xs text-slate-500">{r.lang}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{r.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">{t('intro.native.foot')}</p>
        </Card>
      </div>
      <section className="mt-10">
        <H2>{t('intro.map.title')}</H2>
        <p className="mb-4 text-slate-600 dark:text-slate-400">{t('intro.map.body')}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
            >
              <span className="text-2xl" aria-hidden>
                {c.icon}
              </span>
              <h3 className="mt-1 font-semibold group-hover:underline">{t(c.title)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t(c.body)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
