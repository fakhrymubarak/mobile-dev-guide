import type { Action, Engine, SimState, TraceStep } from './types'

/** Run actions in order, failing loudly if one is not allowed. Returns final state + the last trace. */
export function run(engine: Engine, actions: Action[], from = engine.initial()) {
  let state: SimState = from
  let trace: TraceStep[] = []
  for (const a of actions) {
    const ok = engine.can(state, a)
    if (!ok.ok) throw new Error(`${engine.platform}: "${a}" not allowed: ${ok.reasonKey}`)
    ;({ state, trace } = engine.dispatch(state, a))
  }
  return { state, trace }
}

/** "Entity.label" for every callback step — what a developer would see in Logcat / the console. */
export const callbacks = (trace: TraceStep[]) =>
  trace.filter((s) => s.kind === 'callback').map((s) => `${s.entity}.${s.label}`)
