// The lifecycle engine is pure: dispatch(state, action) → { state, trace }.
// The UI never decides what callback fires — it only replays the trace.

export type Platform = 'android' | 'ios'

export type Action =
  | 'launch' // tap the app icon, or pick the app in Recents / App Switcher
  | 'home'
  | 'back'
  | 'recents'
  | 'swipeAway' // swipe the app away in Recents / App Switcher
  | 'openDetail'
  | 'tapPlus'
  | 'interrupt' // partial interruption: permission dialog / Control Center
  | 'dismiss'
  | 'lock'
  | 'unlock'
  | 'rotate'
  | 'kill' // system kills the backgrounded process (low memory)
  | 'postureClosed'
  | 'postureHalf'
  | 'postureOpen'
  | 'newWindow'
  | 'closeWindow'
  | 'toggleConfigChanges' // Android only: android:configChanges opt-out

export type Screen = 'home' | 'detail'
export type Surface = 'launcher' | 'app' | 'recents'
export type Posture = 'closed' | 'half' | 'open'
export type Orientation = 'portrait' | 'landscape'

export type HolderId =
  | 'remember'
  | 'rememberSaveable'
  | 'viewModel'
  | 'dataStore'
  | 'state'
  | 'sceneStorage'
  | 'appStorage'

export interface SimState {
  platform: Platform
  /** entity id → lifecycle node id. Absent = the object does not exist. */
  entities: Record<string, string>
  surface: Surface
  locked: boolean
  interrupted: boolean
  stack: Screen[]
  secondWindow: boolean
  orientation: Orientation
  posture: Posture
  handleConfigChanges: boolean
  /** Process is alive. */
  alive: boolean
  /** The OS kept enough saved state to restore the UI on next launch. */
  restorable: boolean
  savedStack: Screen[]
  /** Android: a config change happened while the Activity was stopped. */
  pendingConfigChange: boolean
  storage: Partial<Record<HolderId, number>>
  /** Values the OS persisted for restoration (Bundle / scene session). */
  persisted: Partial<Record<HolderId, number>>
}

export type StepKind = 'callback' | 'system' | 'note'

export interface TraceStep {
  lane: string
  entity: string
  /** Code-ish label shown in the log, e.g. "onPause()". Not translated. */
  label: string
  kind: StepKind
  /** Explainer content id (see content/callbacks). */
  cid?: string
  /** Node the entity moves to. null = the object is gone. undefined = no move. */
  to?: string | null
  /** i18n key for an extra note. */
  noteKey?: string
  /** Uses an iOS 27.1+ API. */
  badge?: 'ios27'
}

export interface DispatchResult {
  state: SimState
  trace: TraceStep[]
}

export type Availability = { ok: true; noteKey?: string } | { ok: false; reasonKey: string }

export interface LaneDef {
  id: string
  /** i18n key for the lane title */
  titleKey: string
  nodes: { id: string; label: string }[]
  entities: { id: string; label: string }[]
}

export interface HolderDef {
  id: HolderId
  label: string
  /** i18n key: one-liner on what it survives */
  descKey: string
}

/** The interface of a platform engine — the only thing the UI depends on. */
export interface Engine {
  platform: Platform
  lanes: LaneDef[]
  holders: HolderDef[]
  initial(): SimState
  can(state: SimState, action: Action): Availability
  dispatch(state: SimState, action: Action): DispatchResult
}
