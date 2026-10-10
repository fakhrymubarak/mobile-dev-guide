import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Action } from '../engine'
import { Icon } from './Icons'
import { actionLabel } from './labels'
import { Screen } from './Screen'
import type { Simulator } from './useSimulator'

const SIZE = {
  closed: { w: 210, h: 430 },
  open: { w: 320, h: 380 },
}

/** An emulator window: device frame + the tool's own controls. */
export function Device({ sim }: { sim: Simulator }) {
  const { t } = useTranslation()
  const { state, engine } = sim
  const android = engine.platform === 'android'
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  // The UI checks against the *committed* state; queued actions are re-checked when they start.
  const act = (a: Action) => {
    const ok = engine.can(state, a)
    if (!ok.ok && !sim.busy) return setToast(t(ok.reasonKey))
    if (ok.ok && ok.noteKey) setToast(t(ok.noteKey))
    sim.dispatch(a)
  }

  const base = state.posture === 'closed' ? SIZE.closed : SIZE.open
  const landscape = state.orientation === 'landscape'
  const w = landscape ? base.h : base.w
  const h = landscape ? base.w : base.h

  const tool = (a: Action, icon: string, extra?: { active?: boolean; label?: string }) => {
    const ok = engine.can(state, a)
    const label = extra?.label ?? actionLabel(t, engine.platform, a)
    return (
      <button
        key={a}
        onClick={() => act(a)}
        title={ok.ok ? label : `${label} — ${t(ok.reasonKey)}`}
        aria-label={label}
        className={`flex items-center justify-center rounded-lg p-2 transition ${
          extra?.active
            ? android
              ? 'bg-droid text-slate-950'
              : 'bg-apple text-white'
            : ok.ok
              ? 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
              : 'text-slate-300 dark:text-slate-600'
        }`}
      >
        <Icon name={icon} />
      </button>
    )
  }

  const postureTools = [
    tool('postureClosed', 'closed', { active: state.posture === 'closed' }),
    tool('postureHalf', 'half', { active: state.posture === 'half' }),
    tool('postureOpen', 'open', { active: state.posture === 'open' }),
  ]
  const windowTool = state.secondWindow ? tool('closeWindow', 'closeWindow') : tool('newWindow', 'window')

  const frame = (
    <motion.div
      animate={{ width: w + 20, height: h + 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={{ perspective: 1200 }}
      className={`relative shrink-0 bg-slate-900 p-[10px] shadow-xl ring-1 ring-slate-700 dark:bg-black dark:ring-slate-600 ${
        android ? 'rounded-[26px]' : 'rounded-[40px]'
      }`}
    >
      <motion.div
        animate={{ rotateY: state.posture === 'half' ? (landscape ? 0 : 14) : 0, rotateX: state.posture === 'half' && landscape ? 18 : 0 }}
        className={`relative h-full w-full overflow-hidden ${android ? 'rounded-[18px]' : 'rounded-[32px]'}`}
      >
        <Screen platform={engine.platform} state={state} activeStep={sim.activeStep} act={act} />
        <Hinge android={android} posture={state.posture} landscape={landscape} />
      </motion.div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-3 -bottom-3 z-30 translate-y-full rounded-lg bg-amber-100 px-3 py-2 text-center text-xs text-amber-900 shadow dark:bg-amber-900 dark:text-amber-100"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  if (android)
    return (
      <div className="flex flex-col items-center max-[420px]:[zoom:0.8]">
        <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Foldable AVD · Android 16</div>
        <div className="flex items-start gap-3">
          {frame}
          {/* Android Emulator: floating vertical toolbar */}
          <div className="flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label={t('pg.toolbar')}>
            {tool(state.locked ? 'unlock' : 'lock', 'power')}
            {tool('rotate', 'rotate')}
            <hr className="my-0.5 border-slate-200 dark:border-slate-700" />
            {tool('back', 'back')}
            {tool('home', 'home')}
            {tool('recents', 'recents')}
            <hr className="my-0.5 border-slate-200 dark:border-slate-700" />
            {postureTools}
            {windowTool}
            <hr className="my-0.5 border-slate-200 dark:border-slate-700" />
            {tool('interrupt', 'dialog')}
            {tool('kill', 'memory')}
          </div>
        </div>
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300" title={t('pg.configChanges.hint')}>
          <input type="checkbox" className="accent-droid-ink" checked={state.handleConfigChanges} onChange={() => act('toggleConfigChanges')} />
          <code className="font-mono">android:configChanges</code>
        </label>
      </div>
    )

  return (
    <div className="flex flex-col items-center max-[420px]:[zoom:0.8]">
      {/* Xcode Simulator: window title bar with its toolbar buttons */}
      <div className="mb-3 flex w-full max-w-[400px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label={t('pg.toolbar')}>
        <span className="mr-1 flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="mr-auto truncate text-xs font-medium text-slate-500 dark:text-slate-400">iPhone Duo · iOS 27.1</span>
        {tool('home', 'home')}
        {tool('recents', 'switcher')}
        {tool('rotate', 'rotate')}
      </div>
      {frame}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {tool(state.locked ? 'unlock' : 'lock', 'lock')}
        {tool('back', 'back')}
        {tool('interrupt', 'control')}
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
        {postureTools}
        {windowTool}
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
        {tool('kill', 'memory')}
      </div>
    </div>
  )
}

/** The fold: a crease when open, and the hinge area (FoldingFeature / reservedRegion) when half-open. */
function Hinge({ android, posture, landscape }: { android: boolean; posture: string; landscape: boolean }) {
  if (posture === 'closed') return null
  const pos = landscape ? 'inset-x-0 top-1/2 h-5 -translate-y-1/2' : 'inset-y-0 left-1/2 w-5 -translate-x-1/2'
  if (posture === 'open')
    return <div className={`pointer-events-none absolute ${landscape ? 'inset-x-0 top-1/2 h-px' : 'inset-y-0 left-1/2 w-px'} bg-slate-400/40`} />
  return (
    <div
      className={`pointer-events-none absolute z-10 flex items-center justify-center ${pos} ${
        android ? 'border-x-2 border-dashed border-droid-ink/70 bg-droid/10' : 'hatch'
      }`}
    >
      <span className={`rounded bg-slate-900/80 px-1 font-mono text-[8px] whitespace-nowrap text-white ${landscape ? '' : '-rotate-90'}`}>
        {android ? 'FoldingFeature' : 'reservedRegion'}
      </span>
    </div>
  )
}
