import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { snippetsFor } from '../content/snippets'
import type { Platform } from '../engine'
import { CodeBlock } from './CodeBlock'
import { PlatformBadge } from './PlatformBadge'

export type Topic =
  | { kind: 'callback'; platform: Platform; cid: string; label: string; laneTitleKey?: string; lane?: string; noteKey?: string; badge?: 'ios27' }
  | { kind: 'lane'; platform: Platform; lane: string; titleKey: string }

const Ctx = createContext<(topic: Topic) => void>(() => {})

export const useExplain = () => useContext(Ctx)

const LEGACY_LANES = new Set(['fragment', 'viewController'])

export function ExplainerProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const open = useCallback((t: Topic) => setTopic(t), [])

  useEffect(() => {
    if (!topic) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTopic(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [topic])

  return (
    <Ctx.Provider value={open}>
      {children}
      <AnimatePresence>{topic && <Drawer key="drawer" topic={topic} onClose={() => setTopic(null)} />}</AnimatePresence>
    </Ctx.Provider>
  )
}

function Drawer({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const { t } = useTranslation()
  const snippets = useMemo(() => (topic.kind === 'callback' ? snippetsFor(topic.cid) : []), [topic])
  const legacy = topic.kind === 'callback' && topic.lane && LEGACY_LANES.has(topic.lane)

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-modal="false"
        aria-label={topic.kind === 'callback' ? topic.label : t(topic.titleKey)}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl lg:inset-x-auto lg:top-16 lg:right-4 lg:bottom-4 lg:max-h-none lg:w-[440px] lg:rounded-2xl dark:border-slate-800 dark:bg-slate-900"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <PlatformBadge platform={topic.platform} />
          {topic.kind === 'callback' && topic.laneTitleKey && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t(topic.laneTitleKey)}</span>
          )}
          {topic.kind === 'callback' && topic.badge === 'ios27' && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{t('pg.ios27')}</span>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t('common.close')}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {topic.kind === 'lane' ? (
          <>
            <h2 className="mb-2 text-xl font-bold">{t(topic.titleKey)}</h2>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{t(`laneDesc.${topic.lane}`)}</p>
          </>
        ) : (
          <>
            <h2 className="mb-2 font-mono text-lg font-semibold break-words">{topic.label}</h2>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{t(`x.${topic.cid}`)}</p>
            {topic.noteKey && (
              <p className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
                {t(topic.noteKey)}
              </p>
            )}
            {snippets.length > 0 && (
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{t('pg.modern')}</h3>
                {legacy && <p className="text-sm text-slate-600 dark:text-slate-400">{t(`pg.legacy.${topic.lane}`)}</p>}
                {snippets.map((s, i) => (
                  <CodeBlock key={i} snippet={s} />
                ))}
              </div>
            )}
          </>
        )}
      </motion.aside>
    </>
  )
}
