import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import { engines, type Action, type Platform } from '../engine'
import { Device } from './Device'
import { Lanes } from './Lanes'
import { Log } from './Log'
import { StatePanel } from './StatePanel'
import { useSimulator, type Simulator } from './useSimulator'

const SCENARIOS: { id: string; actions: Action[] }[] = [
  { id: 'coldStart', actions: ['launch'] },
  { id: 'interrupt', actions: ['launch', 'interrupt', 'dismiss'] },
  { id: 'homeBack', actions: ['launch', 'home', 'launch'] },
  { id: 'rotate', actions: ['launch', 'tapPlus', 'tapPlus', 'rotate'] },
  { id: 'navigate', actions: ['launch', 'tapPlus', 'openDetail', 'back'] },
  { id: 'lowMemory', actions: ['launch', 'tapPlus', 'tapPlus', 'openDetail', 'home', 'kill', 'launch'] },
  { id: 'swipe', actions: ['launch', 'tapPlus', 'recents', 'swipeAway', 'launch'] },
  { id: 'unfold', actions: ['launch', 'tapPlus', 'postureOpen', 'postureHalf'] },
  { id: 'split', actions: ['launch', 'postureOpen', 'newWindow'] },
]

const SHARED: Action[] = ['launch', 'home', 'back', 'recents', 'swipeAway', 'openDetail', 'tapPlus', 'interrupt', 'dismiss', 'rotate', 'kill']

const SPEEDS = [
  { label: '0.5×', ms: 1100 },
  { label: '1×', ms: 450 },
  { label: '2×', ms: 260 },
  { label: '4×', ms: 110 },
]

export function Playground() {
  const { t } = useTranslation()
  const [speed, setSpeed] = useState(1)
  const [stepMode, setStepMode] = useState(false)
  const [show, setShow] = useState<Platform>('android')
  const opts = { stepMs: SPEEDS[speed].ms, stepMode }
  const android = useSimulator(engines.android, opts)
  const ios = useSimulator(engines.ios, opts)
  const sims = [android, ios]

  const both = (...actions: Action[]) => sims.forEach((s) => s.dispatch(...actions))
  const runScenario = (actions: Action[]) =>
    sims.forEach((s) => {
      s.reset()
      s.dispatch(...actions)
    })
  const busy = sims.some((s) => s.busy)

  // A shared button is enabled when at least one phone can do it right now (or something is queued).
  const lockAction: Action = android.state.locked || ios.state.locked ? 'unlock' : 'lock'
  const enabled = (a: Action) => busy || sims.some((s) => s.engine.can(s.state, a).ok)

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-6 pb-16">
      <div className="mb-5 max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('pg.title')}</h1>
        <p className="mt-1.5 text-slate-600 dark:text-slate-400">{t('pg.intro')}</p>
      </div>

      {/* shared controls */}
      <section className="z-20 md:sticky md:top-[53px] -mx-4 mb-6 border-y border-slate-200 bg-slate-50/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{t('pg.both')}</span>
          {[...SHARED, lockAction].map((a) => (
            <button
              key={a}
              disabled={!enabled(a)}
              onClick={() => both(a)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium hover:border-slate-500 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-400"
            >
              {t(`action.${a}`)}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />
          {(['postureClosed', 'postureHalf', 'postureOpen'] as const).map((a) => (
            <button
              key={a}
              disabled={!enabled(a)}
              onClick={() => both(a)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium hover:border-slate-500 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              {t(`action.${a}`)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              {t('pg.speed')}
              <select value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-md border border-slate-300 bg-white px-1 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                {SPEEDS.map((s, i) => (
                  <option key={s.label} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} />
              {t('pg.stepMode')}
            </label>
            {stepMode && (
              <button
                onClick={() => sims.forEach((s) => s.next())}
                disabled={!busy}
                className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900"
              >
                {t('pg.next')} ›
              </button>
            )}
            <button
              onClick={() => sims.forEach((s) => s.reset())}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ↺ {t('pg.reset')}
            </button>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          <span className="mr-1 shrink-0 self-center text-xs font-semibold tracking-wide text-slate-500 uppercase">{t('pg.scenarios')}</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => runScenario(s.actions)}
              title={t(`sc.${s.id}.d`)}
              className="shrink-0 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20"
            >
              {t(`sc.${s.id}`)}
            </button>
          ))}
        </div>
      </section>

      {/* platform switch below xl */}
      <div className="mb-4 flex gap-2 xl:hidden" role="tablist">
        {(['android', 'ios'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={show === p}
            onClick={() => setShow(p)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              show === p ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {t(`common.${p}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {sims.map((sim) => (
          <PlatformColumn key={sim.engine.platform} sim={sim} hidden={sim.engine.platform !== show} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">{t('pg.tapExplain')}</p>
    </main>
  )
}

function PlatformColumn({ sim, hidden }: { sim: Simulator; hidden: boolean }) {
  const { t } = useTranslation()
  return (
    <section className={`${hidden ? 'hidden xl:block' : ''} min-w-0`} aria-label={t(`common.${sim.engine.platform}`)}>
      <div className="mb-3 flex items-center gap-2">
        <PlatformBadge platform={sim.engine.platform} className="text-sm" />
        {sim.queued > 0 && <span className="text-xs text-slate-500">{t('pg.queue', { count: sim.queued })}</span>}
      </div>
      {/* Lanes sit beside the phone when there's room; an unfolded phone pushes them below on two-column layouts. */}
      <div
        className={`grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-start xl:grid-cols-1 ${
          sim.state.posture === 'closed' ? '2xl:grid-cols-[auto_minmax(0,1fr)]' : ''
        }`}
      >
        <div className={`flex justify-center md:sticky md:top-36 xl:static ${sim.state.posture === 'closed' ? '2xl:sticky' : ''}`}>
          <Device sim={sim} />
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{t('pg.lanes')}</h3>
            <Lanes engine={sim.engine} entities={sim.entities} activeStep={sim.activeStep} />
          </div>
          <StatePanel sim={sim} />
        </div>
      </div>
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{t('pg.log')}</h3>
        <Log engine={sim.engine} log={sim.log} activeStep={sim.activeStep} />
      </div>
    </section>
  )
}
