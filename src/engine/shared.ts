import type { Action, Availability, LaneDef, Posture, SimState, StepKind, TraceStep } from './types'

export function clone(s: SimState): SimState {
  return {
    ...s,
    entities: { ...s.entities },
    stack: [...s.stack],
    savedStack: [...s.savedStack],
    storage: { ...s.storage },
    persisted: { ...s.persisted },
  }
}

export function baseState(platform: SimState['platform']): SimState {
  return {
    platform,
    entities: {},
    surface: 'launcher',
    locked: false,
    interrupted: false,
    stack: ['home'],
    secondWindow: false,
    orientation: 'portrait',
    posture: 'closed',
    handleConfigChanges: false,
    alive: false,
    restorable: false,
    savedStack: ['home'],
    pendingConfigChange: false,
    storage: {},
    persisted: {},
  }
}

/**
 * Records steps while applying their entity moves to a draft state, so the
 * draft always reflects "everything traced so far".
 */
export class Tracer {
  readonly steps: TraceStep[] = []
  private laneOf: Record<string, string> = {}

  constructor(
    readonly s: SimState,
    lanes: LaneDef[],
  ) {
    for (const lane of lanes) for (const e of lane.entities) this.laneOf[e.id] = lane.id
  }

  private push(kind: StepKind, entity: string, label: string, cid?: string, to?: string | null, noteKey?: string, badge?: 'ios27') {
    const lane = this.laneOf[entity]
    if (!lane) throw new Error(`Unknown entity ${entity}`)
    this.steps.push({ kind, lane, entity, label, cid, to, noteKey, badge })
    if (to === null) delete this.s.entities[entity]
    else if (to !== undefined) this.s.entities[entity] = to
  }

  cb(entity: string, label: string, cid: string, to?: string | null, noteKey?: string) {
    this.push('callback', entity, label, cid, to, noteKey)
    return this
  }

  /** Same as cb() but marks an iOS 27.1+ API. */
  cb27(entity: string, label: string, cid: string, noteKey?: string) {
    this.push('callback', entity, label, cid, undefined, noteKey, 'ios27')
    return this
  }

  /** Something the system does without calling your code. */
  sys(entity: string, label: string, cid?: string, to?: string | null, noteKey?: string) {
    this.push('system', entity, label, cid, to, noteKey)
    return this
  }

  note(entity: string, noteKey: string) {
    this.push('note', entity, '', undefined, undefined, noteKey)
    return this
  }

  has(entity: string) {
    return entity in this.s.entities
  }
}

const POSTURE_ACTION: Partial<Record<Action, Posture>> = {
  postureClosed: 'closed',
  postureHalf: 'half',
  postureOpen: 'open',
}

export function postureOf(action: Action): Posture | undefined {
  return POSTURE_ACTION[action]
}

/** Rules that are identical on both platforms (what the UI lets you do). */
export function commonCan(s: SimState, a: Action): Availability {
  const no = (reasonKey: string): Availability => ({ ok: false, reasonKey })
  const target = postureOf(a)

  if (s.interrupted && a !== 'dismiss' && !target) return no('reason.dismissFirst')
  if (s.locked && !['unlock', 'kill', 'toggleConfigChanges'].includes(a) && !target) return no('reason.locked')

  if (target) return s.posture === target ? no('reason.samePosture') : { ok: true }

  switch (a) {
    case 'launch':
      return s.surface === 'app' ? no('reason.alreadyOpen') : { ok: true }
    case 'home':
      return s.surface === 'launcher' ? no('reason.alreadyHome') : { ok: true }
    case 'back':
    case 'recents':
    case 'interrupt':
    case 'rotate':
      return s.surface === 'app' ? { ok: true } : no('reason.openAppFirst')
    case 'swipeAway':
      return s.surface === 'recents' ? { ok: true } : no('reason.notInRecents')
    case 'openDetail':
    case 'tapPlus':
      if (s.surface !== 'app') return no('reason.openAppFirst')
      return s.stack[s.stack.length - 1] === 'home' ? { ok: true } : no('reason.notOnHome')
    case 'dismiss':
      return s.interrupted ? { ok: true } : no('reason.nothingToDismiss')
    case 'lock':
      return { ok: true }
    case 'unlock':
      return s.locked ? { ok: true } : no('reason.notLocked')
    case 'kill':
      if (!s.alive) return no('reason.notRunning')
      return s.surface !== 'app' || s.locked ? { ok: true } : no('reason.notInBackground')
    case 'newWindow':
      if (s.surface !== 'app') return no('reason.openAppFirst')
      if (s.posture === 'closed') return no('reason.innerOnly')
      return s.secondWindow ? no('reason.alreadyTwoWindows') : { ok: true }
    case 'closeWindow':
      return s.secondWindow ? { ok: true } : no('reason.noSecondWindow')
    case 'toggleConfigChanges':
      return { ok: true }
  }
  return no('reason.unknown')
}

export function top(s: SimState) {
  return s.stack[s.stack.length - 1]
}

/** Objects shown reaching a terminal node during playback are dropped afterwards. */
export function settle(s: SimState, terminal = ['destroyed', 'disposed']): SimState {
  for (const [id, node] of Object.entries(s.entities)) if (terminal.includes(node)) delete s.entities[id]
  return s
}
