import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useExplain } from '../components/Explainer'
import type { Engine, TraceStep } from '../engine'

const ACCENT = {
  android: { node: 'border-droid bg-droid/10', chip: 'bg-droid text-slate-950', ring: 'ring-droid' },
  ios: { node: 'border-apple bg-apple/10', chip: 'bg-apple text-white', ring: 'ring-apple' },
}

/** Swimlanes: one row per lifecycle owner, nodes are its states, chips are live objects. */
export function Lanes({ engine, entities, activeStep }: { engine: Engine; entities: Record<string, string>; activeStep: TraceStep | null }) {
  const { t } = useTranslation()
  const explain = useExplain()
  const accent = ACCENT[engine.platform]

  return (
    <LayoutGroup id={`lanes-${engine.platform}`}>
      <div className="space-y-2.5">
        {engine.lanes.map((lane) => {
          const live = activeStep?.lane === lane.id
          return (
            <div
              key={lane.id}
              className={`rounded-xl border bg-white p-2.5 transition dark:bg-slate-900 ${
                live ? `border-transparent ring-2 ${accent.ring}` : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="mb-2 flex min-h-6 items-center gap-2">
                <button
                  className="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                  onClick={() => explain({ kind: 'lane', platform: engine.platform, lane: lane.id, titleKey: lane.titleKey })}
                >
                  {t(lane.titleKey)}
                </button>
                <AnimatePresence mode="popLayout">
                  {live && activeStep.label && (
                    <motion.span
                      key={activeStep.entity + activeStep.label}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`ml-auto truncate rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                        activeStep.kind === 'callback' ? accent.chip : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {activeStep.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-1">
                {lane.nodes.map((node) => {
                  const here = lane.entities.filter((e) => entities[e.id] === node.id)
                  const terminal = node.id === 'destroyed' || node.id === 'disposed' || node.id === 'notRunning'
                  return (
                    <div key={node.id} className="flex min-w-0 flex-1 items-stretch">
                      <div
                        className={`flex min-h-16 min-w-0 flex-1 flex-col rounded-lg border px-1.5 py-1 transition-colors ${
                          here.length ? accent.node : 'border-dashed border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span className={`text-[10px] leading-tight font-semibold break-words hyphens-auto ${terminal ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`} title={node.label}>
                          {node.label}
                        </span>
                        <div className="mt-1 flex flex-col gap-1">
                          {here.map((e) => (
                            <motion.span
                              layoutId={`${engine.platform}-${e.id}`}
                              key={e.id}
                              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                              className={`rounded-md px-1 py-0.5 font-mono text-[10px] leading-tight font-medium [overflow-wrap:anywhere] shadow-sm ${
                                activeStep?.entity === e.id ? accent.chip : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                              } ${terminal ? 'opacity-50' : ''}`}
                              title={e.label}
                            >
                              {e.label}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
