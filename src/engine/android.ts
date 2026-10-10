import { baseState, clone, commonCan, postureOf, settle, top, Tracer } from './shared'
import type { Action, Availability, DispatchResult, Engine, LaneDef, Screen, SimState } from './types'

const PROC = 'process'
const ACT = 'MainActivity'
const ACT2 = 'MainActivity#2'
const frag = (s: Screen) => (s === 'home' ? 'HomeFragment' : 'DetailFragment')
const comp = (s: Screen) => (s === 'home' ? 'HomeScreen' : 'DetailScreen')

const LIFECYCLE_NODES = [
  { id: 'created', label: 'CREATED' },
  { id: 'started', label: 'STARTED' },
  { id: 'resumed', label: 'RESUMED' },
  { id: 'destroyed', label: 'DESTROYED' },
]

export const androidLanes: LaneDef[] = [
  {
    id: 'process',
    titleKey: 'lane.process',
    nodes: [
      { id: 'notRunning', label: 'Not running' },
      { id: 'foreground', label: 'Foreground' },
      { id: 'background', label: 'Cached (background)' },
    ],
    entities: [{ id: PROC, label: 'app process' }],
  },
  {
    id: 'activity',
    titleKey: 'lane.activity',
    nodes: LIFECYCLE_NODES,
    entities: [
      { id: ACT, label: 'MainActivity' },
      { id: ACT2, label: 'MainActivity #2' },
    ],
  },
  {
    id: 'fragment',
    titleKey: 'lane.fragment',
    nodes: LIFECYCLE_NODES,
    entities: [
      { id: 'HomeFragment', label: 'HomeFragment' },
      { id: 'DetailFragment', label: 'DetailFragment' },
    ],
  },
  {
    id: 'compose',
    titleKey: 'lane.compose',
    nodes: [
      { id: 'created', label: 'Composed · CREATED' },
      { id: 'started', label: 'STARTED' },
      { id: 'resumed', label: 'RESUMED' },
      { id: 'disposed', label: 'Left composition' },
    ],
    entities: [
      { id: 'HomeScreen', label: 'HomeScreen()' },
      { id: 'DetailScreen', label: 'DetailScreen()' },
    ],
  },
]

// ── building blocks ────────────────────────────────────────────────────────

/** Activity created → resumed, with its fragments and composables (outside-in). */
function startUp(t: Tracer, restoring: boolean) {
  const s = t.s
  t.cb(ACT, `onCreate(savedInstanceState = ${restoring ? 'Bundle' : 'null'})`, 'a.onCreate', 'created', restoring ? 'note.a.restoring' : undefined)
  for (const screen of s.stack.slice(0, -1)) {
    t.cb(frag(screen), 'onAttach(context)', 'f.onAttach')
    t.cb(frag(screen), 'onCreate(savedInstanceState)', 'f.onCreate', 'created', 'note.f.backStackNoView')
  }
  const sc = top(s)
  t.cb(frag(sc), 'onAttach(context)', 'f.onAttach')
  t.cb(frag(sc), 'onCreate(savedInstanceState)', 'f.onCreate', 'created')
  t.cb(frag(sc), 'onCreateView(…)', 'f.onCreateView')
  t.cb(frag(sc), 'onViewCreated(view, …)', 'f.onViewCreated')
  t.cb(comp(sc), 'enters composition', 'c.enter', 'created', restoring ? 'note.c.saveableRestored' : undefined)
  startAll(t)
  resumeAll(t)
}

function startAll(t: Tracer) {
  const sc = top(t.s)
  t.cb(ACT, 'onStart()', 'a.onStart', 'started')
  t.cb(frag(sc), 'onStart()', 'f.onStart', 'started')
  t.cb(comp(sc), 'LifecycleStartEffect { onStart }', 'c.start', 'started')
  if (t.s.secondWindow) t.cb(ACT2, 'onStart()', 'a.onStart', 'started')
}

function resumeAll(t: Tracer) {
  const sc = top(t.s)
  t.cb(ACT, 'onResume()', 'a.onResume', 'resumed')
  t.cb(frag(sc), 'onResume()', 'f.onResume', 'resumed')
  t.cb(comp(sc), 'LifecycleResumeEffect { onResume }', 'c.resume', 'resumed')
  if (t.s.secondWindow) t.cb(ACT2, 'onResume()', 'a.onResume', 'resumed')
}

/** Teardown is inside-out: composable → fragment → activity. */
function pauseAll(t: Tracer, noteKey?: string) {
  const sc = top(t.s)
  t.cb(comp(sc), 'onPauseOrDispose { }', 'c.pause', 'started')
  t.cb(frag(sc), 'onPause()', 'f.onPause', 'started')
  t.cb(ACT, 'onPause()', 'a.onPause', 'started', noteKey)
  if (t.s.secondWindow) t.cb(ACT2, 'onPause()', 'a.onPause', 'started')
}

function stopAll(t: Tracer) {
  const s = t.s
  const sc = top(s)
  t.cb(comp(sc), 'onStopOrDispose { }', 'c.stop', 'created')
  t.cb(frag(sc), 'onStop()', 'f.onStop', 'created')
  t.cb(ACT, 'onStop()', 'a.onStop', 'created')
  if (s.secondWindow) t.cb(ACT2, 'onStop()', 'a.onStop', 'created')
  t.cb(ACT, 'onSaveInstanceState(outState)', 'a.onSaveInstanceState', undefined, 'note.a.saveAfterStop')
  s.persisted.rememberSaveable = s.storage.rememberSaveable ?? 0
  s.savedStack = [...s.stack]
  s.restorable = true
}

function destroyAll(t: Tracer, changingConfig: boolean) {
  const s = t.s
  const sc = top(s)
  if (t.has(comp(sc)) && s.entities[comp(sc)] !== 'disposed') t.cb(comp(sc), 'leaves composition', 'c.leave', 'disposed', 'note.c.rememberLost')
  t.cb(frag(sc), 'onDestroyView()', 'f.onDestroyView')
  t.cb(frag(sc), 'onDestroy()', 'f.onDestroy', 'destroyed')
  t.cb(frag(sc), 'onDetach()', 'f.onDetach')
  for (const screen of s.stack.slice(0, -1)) {
    t.cb(frag(screen), 'onDestroy()', 'f.onDestroy', 'destroyed')
    t.cb(frag(screen), 'onDetach()', 'f.onDetach')
  }
  if (s.secondWindow && !changingConfig) t.cb(ACT2, 'onDestroy()', 'a.onDestroy', 'destroyed')
  t.cb(ACT, 'onDestroy()', 'a.onDestroy', 'destroyed', changingConfig ? 'note.a.changingConfig' : 'note.a.destroyNotGuaranteed')
}

function toBackground(t: Tracer) {
  t.sys(PROC, 'importance → CACHED', 'p.background', 'background')
}

function toForeground(t: Tracer) {
  t.sys(PROC, 'importance → FOREGROUND', 'p.foreground', 'foreground')
}

/** Activity was stopped; bring it back. A config change while stopped means recreate instead. */
function restart(t: Tracer) {
  const s = t.s
  if (s.pendingConfigChange) {
    s.pendingConfigChange = false
    t.note(ACT, 'note.a.recreateOnReturn')
    destroyAll(t, true)
    s.storage.remember = 0
    startUp(t, true)
    return
  }
  t.cb(ACT, 'onRestart()', 'a.onRestart')
  startAll(t)
  resumeAll(t)
}

/** Full recreation while visible (rotate / fold / resize). */
function recreate(t: Tracer) {
  pauseAll(t)
  stopAll(t)
  destroyAll(t, true)
  t.s.storage.remember = 0
  startUp(t, true)
}

function configChange(t: Tracer, noteKey: string) {
  const s = t.s
  const visible = s.surface === 'app' && !s.locked
  if (!s.alive) return
  if (s.handleConfigChanges) {
    t.cb(ACT, 'onConfigurationChanged(newConfig)', 'a.onConfigurationChanged', undefined, noteKey)
    if (visible) t.sys(comp(top(s)), 'recomposes with new LocalConfiguration', 'c.recompose')
    return
  }
  if (visible) {
    t.note(ACT, noteKey)
    recreate(t)
  } else {
    s.pendingConfigChange = true
    t.note(ACT, 'note.a.pendingConfig')
  }
}

function openDetail(t: Tracer) {
  const s = t.s
  t.cb('HomeScreen', 'onPauseOrDispose { }', 'c.pause', 'started')
  t.cb('HomeFragment', 'onPause()', 'f.onPause', 'started')
  t.cb('DetailFragment', 'onAttach(context)', 'f.onAttach')
  t.cb('DetailFragment', 'onCreate(savedInstanceState)', 'f.onCreate', 'created')
  t.cb('DetailFragment', 'onCreateView(…)', 'f.onCreateView')
  t.cb('DetailFragment', 'onViewCreated(view, …)', 'f.onViewCreated')
  t.cb('DetailScreen', 'enters composition', 'c.enter', 'created')
  t.cb('DetailFragment', 'onStart()', 'f.onStart', 'started')
  t.cb('DetailScreen', 'LifecycleStartEffect { onStart }', 'c.start', 'started')
  t.cb('HomeScreen', 'onStopOrDispose { }', 'c.stop', 'created')
  t.cb('HomeFragment', 'onStop()', 'f.onStop', 'created')
  t.cb('HomeScreen', 'leaves composition', 'c.leave', 'disposed', 'note.c.rememberLost')
  s.storage.remember = 0
  t.cb('HomeFragment', 'onDestroyView()', 'f.onDestroyView', 'created', 'note.f.backStack')
  t.cb('DetailFragment', 'onResume()', 'f.onResume', 'resumed')
  t.cb('DetailScreen', 'LifecycleResumeEffect { onResume }', 'c.resume', 'resumed')
  s.stack.push('detail')
}

function popDetail(t: Tracer) {
  const s = t.s
  t.cb('DetailScreen', 'onPauseOrDispose { }', 'c.pause', 'started')
  t.cb('DetailFragment', 'onPause()', 'f.onPause', 'started')
  t.cb('DetailScreen', 'onStopOrDispose { }', 'c.stop', 'created')
  t.cb('DetailFragment', 'onStop()', 'f.onStop', 'created')
  if (!t.has('HomeFragment')) {
    // Restored after process death: the back-stack fragment was never created in this process.
    t.cb('HomeFragment', 'onAttach(context)', 'f.onAttach')
    t.cb('HomeFragment', 'onCreate(savedInstanceState)', 'f.onCreate', 'created')
  }
  t.cb('HomeFragment', 'onCreateView(…)', 'f.onCreateView', undefined, 'note.f.reorder')
  t.cb('HomeFragment', 'onViewCreated(view, …)', 'f.onViewCreated')
  t.cb('HomeScreen', 'enters composition', 'c.enter', 'created', 'note.c.saveableRestored')
  t.cb('HomeFragment', 'onStart()', 'f.onStart', 'started')
  t.cb('HomeScreen', 'LifecycleStartEffect { onStart }', 'c.start', 'started')
  t.cb('DetailScreen', 'leaves composition', 'c.leave', 'disposed')
  t.cb('DetailFragment', 'onDestroyView()', 'f.onDestroyView')
  t.cb('DetailFragment', 'onDestroy()', 'f.onDestroy', 'destroyed')
  t.cb('DetailFragment', 'onDetach()', 'f.onDetach')
  t.cb('HomeFragment', 'onResume()', 'f.onResume', 'resumed')
  t.cb('HomeScreen', 'LifecycleResumeEffect { onResume }', 'c.resume', 'resumed')
  s.stack.pop()
}

function closeSecondWindow(t: Tracer) {
  t.cb(ACT2, 'onPause()', 'a.onPause', 'started')
  t.cb(ACT2, 'onStop()', 'a.onStop', 'created')
  t.cb(ACT2, 'onDestroy()', 'a.onDestroy', 'destroyed')
  t.s.secondWindow = false
}

/** The process is gone: every object vanishes without a callback. */
function vanishAll(t: Tracer) {
  for (const id of Object.keys(t.s.entities)) {
    if (id === PROC || ['destroyed', 'disposed'].includes(t.s.entities[id])) continue
    t.sys(id, '(gone — no callback)', undefined, null)
  }
}

// ── engine ─────────────────────────────────────────────────────────────────

function can(s: SimState, a: Action): Availability {
  const c = commonCan(s, a)
  if (!c.ok) return c
  if (a === 'interrupt') return { ok: true, noteKey: 'equiv.androidInterrupt' }
  return c
}

function dispatch(prev: SimState, a: Action): DispatchResult {
  const trace = run(clone(prev), a)
  return { state: settle(trace.state), trace: trace.trace }
}

function run(s: SimState, a: Action): DispatchResult {
  const t = new Tracer(s, androidLanes)
  const target = postureOf(a)

  if (target) {
    const from = s.posture
    s.posture = target
    const displayChange = (from === 'closed') !== (target === 'closed')
    if (s.secondWindow && target === 'closed') closeSecondWindow(t)
    const visible = s.alive && s.surface === 'app' && !s.locked
    if (displayChange) configChange(t, 'note.fold.android')
    if (visible) {
      const label =
        target === 'closed' ? 'FoldingFeature: none (outer display)' : `FoldingFeature(state = ${target === 'half' ? 'HALF_OPENED' : 'FLAT'})`
      t.sys(comp(top(s)), label, 'c.folding', undefined, displayChange ? undefined : 'note.c.noConfigChangeHalf')
    } else if (!s.alive) {
      t.note(PROC, 'note.notRunning')
    }
    return { state: s, trace: t.steps }
  }

  switch (a) {
    case 'launch': {
      if (!s.alive) {
        t.sys(PROC, 'process started → Application.onCreate()', 'p.start', 'foreground')
        s.alive = true
        const restoring = s.restorable
        s.stack = restoring ? [...s.savedStack] : ['home']
        s.storage = {
          remember: 0,
          viewModel: 0,
          rememberSaveable: restoring ? (s.persisted.rememberSaveable ?? 0) : 0,
          dataStore: s.persisted.dataStore ?? 0,
        }
        s.pendingConfigChange = false
        startUp(t, restoring)
      } else {
        toForeground(t)
        restart(t)
      }
      s.surface = 'app'
      break
    }
    case 'home':
      if (s.surface === 'recents') t.note(ACT, 'note.a.alreadyStopped')
      else {
        pauseAll(t)
        stopAll(t)
        toBackground(t)
      }
      s.surface = 'launcher'
      break
    case 'back':
      if (top(s) === 'detail') popDetail(t)
      else {
        t.note(ACT, 'note.a.android12Back')
        pauseAll(t)
        stopAll(t)
        toBackground(t)
        s.surface = 'launcher'
      }
      break
    case 'recents':
      pauseAll(t)
      stopAll(t)
      toBackground(t)
      s.surface = 'recents'
      break
    case 'swipeAway':
      destroyAll(t, false)
      t.sys(PROC, 'process killed (task removed)', 'p.killed', 'notRunning', 'note.p.swipe')
      vanishAll(t)
      s.alive = false
      s.restorable = false
      s.secondWindow = false
      s.persisted.rememberSaveable = undefined
      s.storage = {}
      s.surface = 'launcher'
      break
    case 'openDetail':
      openDetail(t)
      break
    case 'tapPlus':
      for (const h of ['remember', 'rememberSaveable', 'viewModel', 'dataStore'] as const) s.storage[h] = (s.storage[h] ?? 0) + 1
      s.persisted.dataStore = s.storage.dataStore
      t.sys('HomeScreen', 'recomposition (count changed)', 'c.recompose')
      break
    case 'interrupt':
      pauseAll(t, 'note.a.partiallyVisible')
      s.interrupted = true
      break
    case 'dismiss':
      resumeAll(t)
      s.interrupted = false
      break
    case 'lock':
      if (s.surface === 'app') {
        pauseAll(t)
        stopAll(t)
        toBackground(t)
      } else t.note(PROC, 'note.notForeground')
      s.locked = true
      break
    case 'unlock':
      s.locked = false
      if (s.surface === 'app') {
        toForeground(t)
        restart(t)
      } else t.note(PROC, 'note.notForeground')
      break
    case 'rotate':
      s.orientation = s.orientation === 'portrait' ? 'landscape' : 'portrait'
      configChange(t, 'note.rotate.android')
      break
    case 'kill':
      t.sys(PROC, 'low-memory killer ends the process', 'p.killed', 'notRunning', 'note.p.noOnDestroy')
      vanishAll(t)
      s.alive = false
      s.secondWindow = false
      s.storage = {}
      break
    case 'newWindow':
      configChange(t, 'note.a.splitResize')
      t.cb(ACT2, 'onCreate(savedInstanceState = null)', 'a.onCreate', 'created')
      t.cb(ACT2, 'onStart()', 'a.onStart', 'started')
      t.cb(ACT2, 'onResume()', 'a.onResume', 'resumed', 'note.a.multiResume')
      s.secondWindow = true
      break
    case 'closeWindow':
      closeSecondWindow(t)
      configChange(t, 'note.a.splitResize')
      break
    case 'toggleConfigChanges':
      s.handleConfigChanges = !s.handleConfigChanges
      t.note(ACT, s.handleConfigChanges ? 'note.a.configChangesOn' : 'note.a.configChangesOff')
      break
  }
  return { state: s, trace: t.steps }
}

export const androidEngine: Engine = {
  platform: 'android',
  lanes: androidLanes,
  holders: [
    { id: 'remember', label: 'remember { }', descKey: 'holder.remember' },
    { id: 'rememberSaveable', label: 'rememberSaveable { }', descKey: 'holder.rememberSaveable' },
    { id: 'viewModel', label: 'ViewModel', descKey: 'holder.viewModel' },
    { id: 'dataStore', label: 'DataStore', descKey: 'holder.dataStore' },
  ],
  initial: () => ({ ...baseState('android'), entities: { [PROC]: 'notRunning' } }),
  can,
  dispatch,
}
