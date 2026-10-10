import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HolderId } from '../engine'
import type { Simulator } from './useSimulator'

/** The state-survival demo: which holder kept the count through the last event? */
export function StatePanel({ sim }: { sim: Simulator }) {
  const { t } = useTranslation()
  const { state, engine } = sim
  const prev = useRef(state.storage)
  const [lost, setLost] = useState<Partial<Record<HolderId, boolean>>>({})

  useEffect(() => {
    const before = prev.current
    const next: Partial<Record<HolderId, boolean>> = {}
    for (const h of engine.holders) {
      const was = before[h.id] ?? 0
      const now = state.storage[h.id]
      if (was > 0 && (now ?? 0) < was) next[h.id] = true
    }
    prev.current = state.storage
    if (Object.keys(next).length) setLost(next)
  }, [state.storage, engine.holders])

  useEffect(() => {
    if (!Object.keys(lost).length) return
    const id = setTimeout(() => setLost({}), 3500)
    return () => clearTimeout(id)
  }, [lost])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{t('pg.state')}</h3>
      <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">{t('pg.stateHint')}</p>
      <ul className="space-y-1.5">
        {engine.holders.map((h) => {
          const v = state.storage[h.id]
          return (
            <li key={h.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <code className="font-mono text-xs font-semibold">{h.label}</code>
                <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{t(h.descKey)}</p>
              </div>
              <motion.span
                key={`${v}-${lost[h.id]}`}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`min-w-12 rounded-md px-2 py-0.5 text-center font-mono text-sm tabular-nums ${
                  lost[h.id] ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {v === undefined ? '—' : v}
                {lost[h.id] && <span className="ml-1 font-sans text-[10px]">{t('pg.lost')}</span>}
              </motion.span>
            </li>
          )
        })}
      </ul>
      {!state.alive && <p className="mt-2 text-[11px] text-slate-500 italic">{t('pg.notRunning')}</p>}
    </div>
  )
}
