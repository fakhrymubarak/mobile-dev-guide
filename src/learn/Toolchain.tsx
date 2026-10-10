import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import type { Platform } from '../engine'
import { Card, H2, PageHeader, useList } from './LearnLayout'

type Step = { t: string; d: string }

function Pipeline({ platform, steps }: { platform: Platform; steps: Step[] }) {
  const tone = platform === 'android' ? 'border-droid-ink/40 bg-droid/10 dark:border-droid/40' : 'border-apple-ink/40 bg-apple/10 dark:border-apple/40'
  return (
    <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
      {steps.map((s, i) => (
        <li key={s.t} className="flex flex-1 flex-col items-stretch gap-2 md:flex-row md:items-center">
          <div className={`flex-1 rounded-xl border-2 p-3 ${tone}`}>
            <div className="text-[10px] font-semibold text-slate-500">{i + 1}</div>
            <div className="font-semibold">{s.t}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{s.d}</div>
          </div>
          {i < steps.length - 1 && <span className="self-center text-slate-400 md:rotate-0">→</span>}
        </li>
      ))}
    </ol>
  )
}

/** A small static emulator next to the list of its real controls. */
function Anatomy({ platform, items }: { platform: Platform; items: string[] }) {
  const android = platform === 'android'
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="flex items-start gap-2" aria-hidden>
        <div className={`relative h-56 w-28 bg-slate-900 p-1.5 ${android ? 'rounded-2xl' : 'rounded-[26px]'}`}>
          <div className={`flex h-full flex-col overflow-hidden bg-gradient-to-b ${android ? 'rounded-xl from-emerald-200 to-sky-200' : 'rounded-[20px] from-sky-200 to-pink-200'}`}>
            <div className="flex justify-center pt-1">
              {android ? <span className="h-1.5 w-1.5 rounded-full bg-slate-900" /> : <span className="h-2 w-8 rounded-full bg-black" />}
            </div>
            <div className="mt-auto flex justify-around pb-1 text-[8px] text-slate-700">{android ? <>◁ ○ ▢</> : <span className="h-0.5 w-10 rounded bg-slate-900" />}</div>
          </div>
        </div>
        {android && (
          <div className="relative flex flex-col gap-1 rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            {['⏻', '🔊', '🔉', '⟲', '⟳', '📷', '◁', '○', '▢', '⋯'].map((g) => (
              <span key={g} className="flex h-4 w-4 items-center justify-center text-[9px]">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ol>
    </div>
  )
}

export function Toolchain() {
  const { t } = useTranslation()
  const rows = useList<{ k: string; a: string; i: string }>('tc.vs.rows')
  return (
    <>
      <PageHeader title={t('tc.title')} lead={t('tc.lead')} />
      <Card className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <PlatformBadge platform="android" />
          <H2>{t('tc.android')}</H2>
        </div>
        <Pipeline platform="android" steps={useList<Step>('tc.steps.android')} />
      </Card>
      <Card className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <PlatformBadge platform="ios" />
          <H2>{t('tc.ios')}</H2>
        </div>
        <Pipeline platform="ios" steps={useList<Step>('tc.steps.ios')} />
      </Card>
      <Card className="mb-5">
        <H2>{t('tc.vs.title')}</H2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="w-32 py-2 pr-3" />
                <th className="py-2 pr-3">
                  <PlatformBadge platform="android" /> Emulator
                </th>
                <th className="py-2">
                  <PlatformBadge platform="ios" /> Simulator
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold">{r.k}</th>
                  <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{r.a}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{r.i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <H2>{t('tc.anatomy.title')}</H2>
        <p className="mb-4 text-slate-600 dark:text-slate-400">{t('tc.anatomy.body')}</p>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <PlatformBadge platform="android" className="mb-3" />
            <Anatomy platform="android" items={useList<string>('tc.anatomy.android')} />
          </div>
          <div>
            <PlatformBadge platform="ios" className="mb-3" />
            <Anatomy platform="ios" items={useList<string>('tc.anatomy.ios')} />
          </div>
        </div>
      </Card>
    </>
  )
}
