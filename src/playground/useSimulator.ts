import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { Action, Engine, SimState, TraceStep } from '../engine'

// Replays engine traces step by step. The engine decides *what* happens;
// this hook only decides *when* each step becomes visible.

export interface LogGroup {
  id: number
  action: Action
  steps: TraceStep[]
  /** How many of `steps` have been revealed. */
  shown: number
  skippedReasonKey?: string
  noteKey?: string
}

interface Model {
  committed: SimState
  queue: Action[]
  playing: { trace: TraceStep[]; cursor: number; base: Record<string, string> } | null
  log: LogGroup[]
  nextId: number
}

type Msg = { type: 'enqueue'; actions: Action[] } | { type: 'advance' } | { type: 'reset' } | { type: 'skipAll' }

const MAX_LOG_GROUPS = 60

function init(engine: Engine): Model {
  return { committed: engine.initial(), queue: [], playing: null, log: [], nextId: 1 }
}

function reducer(engine: Engine) {
  return (m: Model, msg: Msg): Model => {
    switch (msg.type) {
      case 'reset':
        return init(engine)
      case 'enqueue':
        return { ...m, queue: [...m.queue, ...msg.actions] }
      case 'skipAll': {
        // Finish everything instantly (used when the user hits "Next" a lot or changes speed to max).
        let next = m
        while (next.playing || next.queue.length) next = reducer(engine)(next, { type: 'advance' })
        return next
      }
      case 'advance': {
        if (m.playing) {
          // The last step stays highlighted for one tick before playback ends.
          if (m.playing.cursor >= m.playing.trace.length) return { ...m, playing: null }
          const cursor = m.playing.cursor + 1
          const log = m.log.map((g, i) => (i === m.log.length - 1 ? { ...g, shown: cursor } : g))
          return { ...m, playing: { ...m.playing, cursor }, log }
        }
        if (!m.queue.length) return m
        const [action, ...queue] = m.queue
        const id = m.nextId
        const ok = engine.can(m.committed, action)
        if (!ok.ok) {
          const log = [...m.log, { id, action, steps: [], shown: 0, skippedReasonKey: ok.reasonKey }].slice(-MAX_LOG_GROUPS)
          return { ...m, queue, log, nextId: id + 1 }
        }
        const { state, trace } = engine.dispatch(m.committed, action)
        const log = [...m.log, { id, action, steps: trace, shown: 0, noteKey: ok.noteKey }].slice(-MAX_LOG_GROUPS)
        return {
          ...m,
          committed: state,
          queue,
          log,
          nextId: id + 1,
          playing: trace.length ? { trace, cursor: 0, base: m.committed.entities } : null,
        }
      }
    }
  }
}

export interface Simulator {
  engine: Engine
  state: SimState
  /** Entity positions as of the current playback step. */
  entities: Record<string, string>
  activeStep: TraceStep | null
  log: LogGroup[]
  busy: boolean
  queued: number
  dispatch: (...actions: Action[]) => void
  next: () => void
  finish: () => void
  reset: () => void
}

export function useSimulator(engine: Engine, opts: { stepMs: number; stepMode: boolean }): Simulator {
  const reduce = useMemo(() => reducer(engine), [engine])
  const [m, send] = useReducer(reduce, engine, init)

  // Start queued actions right away; advance steps on a timer unless in step mode.
  useEffect(() => {
    if (!m.playing && m.queue.length) {
      const id = setTimeout(() => send({ type: 'advance' }), 60)
      return () => clearTimeout(id)
    }
    if (m.playing && !opts.stepMode) {
      const id = setTimeout(() => send({ type: 'advance' }), m.playing.cursor === 0 ? 120 : opts.stepMs)
      return () => clearTimeout(id)
    }
  }, [m.playing, m.queue.length, opts.stepMode, opts.stepMs])

  const entities = useMemo(() => {
    if (!m.playing) return m.committed.entities
    const e = { ...m.playing.base }
    for (const step of m.playing.trace.slice(0, m.playing.cursor)) {
      if (step.to === null) delete e[step.entity]
      else if (step.to !== undefined) e[step.entity] = step.to
    }
    return e
  }, [m.playing, m.committed.entities])

  const activeStep = m.playing && m.playing.cursor > 0 ? m.playing.trace[m.playing.cursor - 1] : null

  return {
    engine,
    state: m.committed,
    entities,
    activeStep,
    log: m.log,
    busy: !!m.playing || m.queue.length > 0,
    queued: m.queue.length,
    dispatch: useCallback((...actions: Action[]) => send({ type: 'enqueue', actions }), []),
    next: useCallback(() => send({ type: 'advance' }), []),
    finish: useCallback(() => send({ type: 'skipAll' }), []),
    reset: useCallback(() => send({ type: 'reset' }), []),
  }
}
