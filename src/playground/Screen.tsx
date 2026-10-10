import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Action, Platform, SimState, TraceStep } from '../engine'

interface Props {
  platform: Platform
  state: SimState
  activeStep: TraceStep | null
  act: (a: Action) => void
}

const ICON_COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-lime-500', 'bg-cyan-500', 'bg-indigo-400', 'bg-fuchsia-400', 'bg-orange-400', 'bg-teal-500']

/** Everything drawn inside the phone's glass. */
export function Screen({ platform, state, activeStep, act }: Props) {
  const { t } = useTranslation()
  const android = platform === 'android'
  const fragile = android ? 'remember' : 'state'
  const saved = android ? 'rememberSaveable' : 'sceneStorage'

  let body
  if (state.locked) {
    body = (
      <button onClick={() => act('unlock')} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-slate-900 text-white">
        <span className="text-4xl font-light tabular-nums">9:41</span>
        <span className="mt-2 flex items-center gap-1 text-xs opacity-80">🔒 {t('phone.locked')}</span>
        <span className="mt-auto mb-6 text-[11px] opacity-60">{t('phone.tapUnlock')}</span>
      </button>
    )
  } else if (state.surface === 'launcher') {
    body = (
      <div className={`flex h-full flex-col p-4 ${android ? 'bg-gradient-to-br from-emerald-200 via-teal-100 to-sky-200 dark:from-emerald-900 dark:via-teal-950 dark:to-sky-900' : 'bg-gradient-to-br from-sky-300 via-indigo-200 to-pink-200 dark:from-sky-900 dark:via-indigo-950 dark:to-fuchsia-950'}`}>
        <div className="grid grid-cols-4 gap-3 pt-4">
          {ICON_COLORS.slice(0, 7).map((c, i) => (
            <span key={i} className={`mx-auto aspect-square w-9 ${android ? 'rounded-full' : 'rounded-[10px]'} ${c} opacity-70`} />
          ))}
          <button onClick={() => act('launch')} className="flex flex-col items-center gap-1" aria-label={t('action.launch')}>
            <span className={`flex aspect-square w-9 items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white ${android ? 'rounded-full bg-droid-ink' : 'rounded-[10px] bg-apple'}`}>+1</span>
            <span className="text-[9px] font-medium text-slate-800 dark:text-slate-100">{t('phone.appName')}</span>
          </button>
        </div>
        <p className="mt-auto mb-3 text-center text-[10px] text-slate-700 dark:text-slate-300">{t('phone.tapIcon')}</p>
      </div>
    )
  } else if (state.surface === 'recents') {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-700/90 p-4" onClick={() => act('home')}>
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => info.offset.y < -60 && act('swipeAway')}
          onClick={(e) => {
            e.stopPropagation()
            act('launch')
          }}
          className="w-3/4 cursor-grab overflow-hidden rounded-2xl bg-white shadow-2xl active:cursor-grabbing dark:bg-slate-900"
        >
          <div className={`px-3 py-2 text-xs font-semibold ${android ? 'bg-droid/20' : 'bg-apple/15'}`}>{t('phone.appName')}</div>
          <div className="flex h-28 flex-col items-center justify-center text-slate-500">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{state.storage[fragile] ?? 0}</span>
          </div>
        </motion.div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            act('swipeAway')
          }}
          className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white"
        >
          ↑ {t('action.swipeAway')}
        </button>
        <p className="text-center text-[10px] text-white/70">{t('phone.recentsHint')}</p>
      </div>
    )
  } else {
    body = (
      <div className="flex h-full">
        <AppWindow platform={platform} state={state} act={act} fragile={fragile} saved={saved} />
        {state.secondWindow && (
          <>
            <div className="w-1 bg-slate-900" />
            <div className="flex flex-1 flex-col bg-white dark:bg-slate-950">
              <div className={`px-3 py-2 text-xs font-semibold ${android ? 'bg-droid/20' : 'bg-apple/10'}`}>{t('phone.secondWindow')}</div>
              <div className="flex flex-1 items-center justify-center text-3xl font-bold text-slate-300">2</div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StatusBar platform={platform} dark={state.locked || state.surface === 'recents'} />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${state.locked}-${state.surface}-${state.stack.join('/')}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {body}
          </motion.div>
        </AnimatePresence>
        {state.interrupted && <Interruption platform={platform} onDismiss={() => act('dismiss')} />}
        <AnimatePresence>
          {activeStep && activeStep.kind !== 'note' && (
            <motion.div
              key={activeStep.entity + activeStep.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-2 bottom-2 z-20 truncate rounded-lg bg-slate-900/85 px-2 py-1 text-center font-mono text-[10px] text-white"
            >
              {activeStep.entity}.{activeStep.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {android ? <NavBar act={act} disabled={state.locked} /> : <HomeIndicator act={act} disabled={state.locked || state.surface === 'launcher'} />}
    </div>
  )
}

function AppWindow({ platform, state, act, fragile, saved }: Omit<Props, 'activeStep'> & { fragile: 'remember' | 'state'; saved: 'rememberSaveable' | 'sceneStorage' }) {
  const { t } = useTranslation()
  const android = platform === 'android'
  const onDetail = state.stack[state.stack.length - 1] === 'detail'
  const landscape = state.orientation === 'landscape' && !state.secondWindow
  const btn = android
    ? 'rounded-full bg-droid-ink px-4 py-2 text-xs font-semibold text-white'
    : 'rounded-xl bg-apple px-4 py-2 text-xs font-semibold text-white'
  const btnAlt = android
    ? 'rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-droid-ink dark:border-slate-600 dark:text-droid'
    : 'rounded-xl bg-apple/10 px-4 py-2 text-xs font-semibold text-apple'

  if (onDetail)
    return (
      <div className="flex flex-1 flex-col">
        {android ? (
          <div className="flex items-center gap-2 bg-droid/15 px-2 py-2.5">
            <button onClick={() => act('back')} className="rounded-full p-1 hover:bg-black/10" aria-label={t('action.back')}>
              ←
            </button>
            <span className="text-sm font-semibold">{t('phone.details')}</span>
          </div>
        ) : (
          <div className="px-2 pt-1.5">
            <button onClick={() => act('back')} className="text-xs text-apple">
              ‹ {t('phone.appName')}
            </button>
            <h3 className="px-1 text-xl font-bold">{t('phone.details')}</h3>
          </div>
        )}
        <p className="p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t('phone.detailBody')}</p>
      </div>
    )

  return (
    <div className="flex flex-1 flex-col">
      {android ? (
        <div className={`bg-droid/15 px-4 text-sm font-semibold ${landscape ? 'py-1.5' : 'py-3'}`}>{t('phone.appName')}</div>
      ) : (
        <h3 className={`px-3 pt-2 font-bold ${landscape ? 'text-lg' : 'text-2xl'}`}>{t('phone.appName')}</h3>
      )}
      <div className={`flex min-h-0 flex-1 items-center justify-center gap-1 p-3 ${landscape ? 'flex-row gap-6' : 'flex-col'}`}>
        <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">{t('phone.count')}</span>
        <motion.span key={state.storage[fragile]} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className={`font-bold tabular-nums ${landscape ? 'text-3xl' : 'text-5xl'}`}>
          {state.storage[fragile] ?? 0}
        </motion.span>
        <span className="font-mono text-[9px] text-slate-500">
          {android ? 'remember' : '@State'} · {android ? 'saveable' : 'scene'}: {state.storage[saved] ?? 0}
        </span>
        </div>
        <div className={`flex flex-wrap justify-center gap-2 ${landscape ? 'flex-col' : 'mt-3'}`}>
          <button onClick={() => act('tapPlus')} className={btn}>
            +1
          </button>
          <button onClick={() => act('openDetail')} className={btnAlt}>
            {t('phone.openDetails')}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBar({ platform, dark }: { platform: Platform; dark: boolean }) {
  return (
    <div className={`relative flex h-6 shrink-0 items-center justify-between px-4 text-[10px] font-semibold ${dark ? 'bg-slate-900 text-white' : ''}`}>
      <span>9:41</span>
      {platform === 'android' ? (
        <span className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-900 ring-1 ring-slate-700" />
      ) : (
        <span className="absolute top-1 left-1/2 h-4 w-14 -translate-x-1/2 rounded-full bg-black" />
      )}
      <span className="tracking-tighter">▂▄▆ ▮</span>
    </div>
  )
}

function NavBar({ act, disabled }: { act: (a: Action) => void; disabled: boolean }) {
  const { t } = useTranslation()
  const b = 'flex-1 py-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:text-white'
  return (
    <div className="flex shrink-0 border-t border-slate-200 bg-slate-50 text-sm dark:border-slate-800 dark:bg-slate-900">
      <button className={b} disabled={disabled} onClick={() => act('back')} aria-label={t('action.back')} title={t('action.back')}>
        ◁
      </button>
      <button className={b} disabled={disabled} onClick={() => act('home')} aria-label={t('action.home')} title={t('action.home')}>
        ○
      </button>
      <button className={b} disabled={disabled} onClick={() => act('recents')} aria-label={t('action.recents')} title={t('action.recents')}>
        ▢
      </button>
    </div>
  )
}

function HomeIndicator({ act, disabled }: { act: (a: Action) => void; disabled: boolean }) {
  const { t } = useTranslation()
  return (
    <button
      disabled={disabled}
      onClick={() => act('home')}
      className="group flex h-5 shrink-0 items-center justify-center disabled:opacity-40"
      aria-label={t('action.home')}
      title={t('action.home')}
    >
      <span className="h-1 w-24 rounded-full bg-slate-900 transition group-enabled:group-hover:w-28 dark:bg-white" />
    </button>
  )
}

function Interruption({ platform, onDismiss }: { platform: Platform; onDismiss: () => void }) {
  const { t } = useTranslation()
  if (platform === 'android')
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full rounded-3xl bg-slate-50 p-4 text-center shadow-xl dark:bg-slate-800">
          <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-droid-ink/80" />
          <p className="mb-3 text-xs leading-snug font-medium">{t('phone.permTitle')}</p>
          <button onClick={onDismiss} className="mb-1.5 w-full rounded-full bg-droid-ink/10 py-1.5 text-[11px] font-semibold text-droid-ink dark:text-droid">
            {t('phone.allow')}
          </button>
          <button onClick={onDismiss} className="w-full rounded-full bg-droid-ink/10 py-1.5 text-[11px] font-semibold text-droid-ink dark:text-droid">
            {t('phone.deny')}
          </button>
        </div>
      </motion.div>
    )
  return (
    <motion.button
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      onClick={onDismiss}
      className="absolute inset-0 z-10 flex flex-col bg-slate-800/70 p-3 backdrop-blur-md"
    >
      <div className="grid grid-cols-4 gap-2">
        {['bg-apple', 'bg-emerald-500', 'bg-slate-500', 'bg-orange-500', 'bg-slate-500', 'bg-slate-500', 'bg-indigo-500', 'bg-slate-500'].map((c, i) => (
          <span key={i} className={`aspect-square rounded-xl ${c}`} />
        ))}
      </div>
      <span className="mt-auto text-center text-[10px] text-white/80">{t('phone.controlCenter')}</span>
    </motion.button>
  )
}
