import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import { PageHeader, useList } from './LearnLayout'

export function Cheatsheet() {
  const { t } = useTranslation()
  const rows = useList<{ c: string; a: string; i: string }>('cs.rows')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter((r) => `${r.c} ${r.a} ${r.i}`.toLowerCase().includes(needle)) : rows

  return (
    <>
      <PageHeader title={t('cs.title')} lead={t('cs.lead')} />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`${t('w.sample.search')}…`}
        className="mb-4 w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-2.5">{t('cs.concept')}</th>
              <th className="px-4 py-2.5">
                <PlatformBadge platform="android" />
              </th>
              <th className="px-4 py-2.5">
                <PlatformBadge platform="ios" />
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.c} className="border-t border-slate-100 align-top dark:border-slate-800">
                <th className="px-4 py-2 font-semibold">{r.c}</th>
                <td className="px-4 py-2 font-mono text-[13px]">{r.a}</td>
                <td className="px-4 py-2 font-mono text-[13px]">{r.i}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
