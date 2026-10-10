import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useExplain } from '../components/Explainer'
import type { Engine, TraceStep } from '../engine'
import { actionLabel } from './labels'
import type { LogGroup } from './useSimulator'

const LANE_DOT: Record<string, string> = {
  process: 'bg-slate-400',
  activity: 'bg-emerald-500',
  fragment: 'bg-amber-500',
  compose: 'bg-sky-500',
  app: 'bg-slate-400',
  scene: 'bg-blue-500',
  viewController: 'bg-amber-500',
  swiftui: 'bg-violet-500',
  scenePhase: 'bg-pink-500',
}

export function Log({ engine, log, activeStep }: { engine: Engine; log: LogGroup[]; activeStep: TraceStep | null }) {
  const { t } = useTranslation()
  const explain = useExplain()
  const ref = useRef<HTMLDivElement>(null)
  const total = log.reduce((n, g) => n + g.shown, log.length)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [total])

  const laneTitle = (id: string) => engine.lanes.find((l) => l.id === id)?.titleKey

  return (
    <div ref={ref} className="h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 font-mono text-[12px] dark:border-slate-800 dark:bg-slate-900" aria-live="polite">
      {log.length === 0 && <p className="p-2 font-sans text-sm text-slate-500">{t('pg.logEmpty')}</p>}
      {log.map((g) => (
        <div key={g.id} className="mb-2">
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-white py-0.5 font-sans text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <span>▶ {actionLabel(t, engine.platform, g.action)}</span>
            {g.skippedReasonKey && (
              <span className="font-normal text-rose-600 dark:text-rose-400">
                — {t('pg.skipped')}: {t(g.skippedReasonKey)}
              </span>
            )}
          </div>
          {g.noteKey && g.shown > 0 && <p className="mb-1 ml-3 font-sans text-[11px] text-amber-700 dark:text-amber-300">↳ {t(g.noteKey)}</p>}
          {g.steps.slice(0, g.shown).map((s, i) => {
            const active = s === activeStep
            if (s.kind === 'note')
              return (
                <p key={i} className="my-0.5 ml-3 font-sans text-[11px] text-amber-700 dark:text-amber-300">
                  ↳ {t(s.noteKey!)}
                </p>
              )
            return (
              <div key={i}>
                <button
                  disabled={!s.cid}
                  onClick={() =>
                    s.cid &&
                    explain({ kind: 'callback', platform: engine.platform, cid: s.cid, label: s.label, lane: s.lane, laneTitleKey: laneTitle(s.lane), noteKey: s.noteKey, badge: s.badge })
                  }
                  className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 ${
                    active ? 'bg-yellow-100 dark:bg-yellow-400/20' : ''
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${LANE_DOT[s.lane] ?? 'bg-slate-400'}`} />
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">{s.entity}</span>
                  <span className={s.kind === 'callback' ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 italic'}>{s.label}</span>
                  {s.badge === 'ios27' && <span className="rounded bg-amber-400/20 px-1 font-sans text-[10px] text-amber-700 dark:text-amber-300">27.1</span>}
                </button>
                {s.noteKey && <p className="ml-6 font-sans text-[11px] text-amber-700 dark:text-amber-300">↳ {t(s.noteKey)}</p>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
