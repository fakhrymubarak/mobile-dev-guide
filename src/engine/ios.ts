import { baseState, clone, commonCan, postureOf, top, Tracer } from './shared'
import type { Action, Availability, DispatchResult, Engine, LaneDef, Screen, SimState } from './types'

const APP = 'app'
const SCENE = 'scene'
const SCENE2 = 'scene#2'
const PHASE = 'scenePhase'
const vc = (s: Screen) => (s === 'home' ? 'HomeVC' : 'DetailVC')
const view = (s: Screen) => (s === 'home' ? 'HomeView' : 'DetailView')

export const iosLanes: LaneDef[] = [
  {
    id: 'app',
    titleKey: 'lane.app',
    nodes: [
      { id: 'notRunning', label: 'Not running' },
      { id: 'inactive', label: 'Inactive' },
      { id: 'active', label: 'Active' },
      { id: 'background', label: 'Background' },
      { id: 'suspended', label: 'Suspended' },
    ],
    entities: [{ id: APP, label: 'UIApplication' }],
  },
  {
    id: 'scene',
    titleKey: 'lane.scene',
    nodes: [
      { id: 'unattached', label: 'Unattached' },
      { id: 'foregroundInactive', label: 'Foreground Inactive' },
      { id: 'foregroundActive', label: 'Foreground Active' },
      { id: 'background', label: 'Background' },
    ],
    entities: [
      { id: SCENE, label: 'UIWindowScene' },
      { id: SCENE2, label: 'UIWindowScene #2' },
    ],
  },
  {
    id: 'viewController',
    titleKey: 'lane.viewController',
    nodes: [
      { id: 'loaded', label: 'Loaded' },
      { id: 'appearing', label: 'Appearing' },
      { id: 'appeared', label: 'Appeared' },
      { id: 'disappearing', label: 'Disappearing' },
      { id: 'disappeared', label: 'Disappeared' },
    ],
    entities: [
      { id: 'HomeVC', label: 'HomeVC' },
      { id: 'DetailVC', label: 'DetailVC' },
    ],
  },
  {
    id: 'swiftui',
    titleKey: 'lane.swiftui',
    nodes: [
      { id: 'appeared', label: 'On screen (onAppear)' },
      { id: 'disappeared', label: 'Off screen (onDisappear)' },
    ],
    entities: [
      { id: 'HomeView', label: 'HomeView' },
      { id: 'DetailView', label: 'DetailView' },
    ],
  },
  {
    id: 'scenePhase',
    titleKey: 'lane.scenePhase',
    nodes: [
      { id: 'active', label: '.active' },
      { id: 'inactive', label: '.inactive' },
      { id: 'background', label: '.background' },
    ],
    entities: [{ id: PHASE, label: 'scenePhase' }],
  },
]

// ── building blocks ────────────────────────────────────────────────────────

function phase(t: Tracer, p: 'active' | 'inactive' | 'background') {
  t.cb(PHASE, `onChange(of: scenePhase) → .${p}`, `ph.${p}`, p)
}

function activate(t: Tracer, noteKey?: string) {
  t.cb(SCENE, 'sceneDidBecomeActive(_:)', 's.didBecomeActive', 'foregroundActive', noteKey)
  if (t.s.secondWindow) t.cb(SCENE2, 'sceneDidBecomeActive(_:)', 's.didBecomeActive', 'foregroundActive')
  t.sys(APP, 'applicationState = .active', 'a.active', 'active')
  phase(t, 'active')
}

function resignActive(t: Tracer, noteKey?: string) {
  t.cb(SCENE, 'sceneWillResignActive(_:)', 's.willResignActive', 'foregroundInactive', noteKey)
  if (t.s.secondWindow) t.cb(SCENE2, 'sceneWillResignActive(_:)', 's.willResignActive', 'foregroundInactive')
  t.sys(APP, 'applicationState = .inactive', 'a.inactive', 'inactive')
  phase(t, 'inactive')
}

function enterBackground(t: Tracer) {
  const s = t.s
  t.cb(SCENE, 'sceneDidEnterBackground(_:)', 's.didEnterBackground', 'background')
  if (s.secondWindow) t.cb(SCENE2, 'sceneDidEnterBackground(_:)', 's.didEnterBackground', 'background')
  t.sys(APP, 'applicationState = .background', 'a.background', 'background')
  phase(t, 'background')
  t.note(vc(top(s)), 'note.vc.noDisappear')
  t.sys(APP, 'suspended (no callback)', 'a.suspended', 'suspended', 'note.a.suspended')
  s.persisted.sceneStorage = s.storage.sceneStorage ?? 0
  s.savedStack = [...s.stack]
  s.restorable = true
}

/** From background / suspended back to the foreground. No view-controller callbacks. */
function enterForeground(t: Tracer) {
  if (t.s.entities[APP] === 'suspended') t.sys(APP, 'resumed from suspension', 'a.background', 'background')
  t.cb(SCENE, 'sceneWillEnterForeground(_:)', 's.willEnterForeground', 'foregroundInactive', 'note.vc.noAppear')
  if (t.s.secondWindow) t.cb(SCENE2, 'sceneWillEnterForeground(_:)', 's.willEnterForeground', 'foregroundInactive')
  t.sys(APP, 'applicationState = .inactive', 'a.inactive', 'inactive')
  phase(t, 'inactive')
  activate(t)
}

function coldLaunch(t: Tracer, restoring: boolean) {
  const sc = top(t.s)
  t.cb(APP, 'application(_:didFinishLaunchingWithOptions:)', 'a.didFinishLaunching', 'inactive')
  t.cb(SCENE, 'scene(_:willConnectTo:options:)', 's.willConnect', 'unattached', restoring ? 'note.s.restoring' : undefined)
  t.cb(vc(sc), 'viewDidLoad()', 'vc.viewDidLoad', 'loaded')
  t.cb(SCENE, 'sceneWillEnterForeground(_:)', 's.willEnterForeground', 'foregroundInactive')
  phase(t, 'inactive')
  t.cb(vc(sc), 'viewWillAppear(_:)', 'vc.viewWillAppear', 'appearing')
  t.cb(vc(sc), 'viewIsAppearing(_:)', 'vc.viewIsAppearing')
  t.cb(view(sc), '.onAppear { }', 'sw.onAppear', 'appeared')
  activate(t)
  t.cb(vc(sc), 'viewDidAppear(_:)', 'vc.viewDidAppear', 'appeared')
}

function sizeChange(t: Tracer, noteKey: string) {
  const sc = top(t.s)
  t.cb(SCENE, 'windowScene(_:didUpdate:interfaceOrientation:traitCollection:)', 's.didUpdate', undefined, noteKey)
  t.cb(vc(sc), 'viewWillTransition(to:with:)', 'vc.viewWillTransition')
  t.cb(vc(sc), 'registerForTraitChanges { … }', 'vc.traitChange')
  t.sys(view(sc), 'body re-evaluated (new size)', 'sw.body', undefined, 'note.ios.noRestart')
}

function push(t: Tracer) {
  t.cb('DetailVC', 'viewDidLoad()', 'vc.viewDidLoad', 'loaded')
  t.cb('HomeVC', 'viewWillDisappear(_:)', 'vc.viewWillDisappear', 'disappearing')
  t.cb('DetailVC', 'viewWillAppear(_:)', 'vc.viewWillAppear', 'appearing')
  t.cb('DetailVC', 'viewIsAppearing(_:)', 'vc.viewIsAppearing')
  t.cb('DetailView', '.onAppear { }', 'sw.onAppear', 'appeared')
  t.cb('HomeView', '.onDisappear { }', 'sw.onDisappear', 'disappeared', 'note.sw.stateKept')
  t.cb('HomeVC', 'viewDidDisappear(_:)', 'vc.viewDidDisappear', 'disappeared')
  t.cb('DetailVC', 'viewDidAppear(_:)', 'vc.viewDidAppear', 'appeared')
  t.s.stack.push('detail')
}

function pop(t: Tracer) {
  t.cb('DetailVC', 'viewWillDisappear(_:)', 'vc.viewWillDisappear', 'disappearing', 'equiv.iosBack')
  if (!t.has('HomeVC')) t.cb('HomeVC', 'viewDidLoad()', 'vc.viewDidLoad', 'loaded', 'note.vc.lazyLoad')
  t.cb('HomeVC', 'viewWillAppear(_:)', 'vc.viewWillAppear', 'appearing')
  t.cb('HomeVC', 'viewIsAppearing(_:)', 'vc.viewIsAppearing')
  t.cb('HomeView', '.onAppear { }', 'sw.onAppear', 'appeared')
  t.cb('DetailView', '.onDisappear { }', 'sw.onDisappear', 'disappeared')
  t.cb('DetailVC', 'viewDidDisappear(_:)', 'vc.viewDidDisappear', 'disappeared')
  t.cb('HomeVC', 'viewDidAppear(_:)', 'vc.viewDidAppear', 'appeared')
  t.cb('DetailVC', 'deinit', 'vc.deinit', null)
  t.sys('DetailView', '(view released)', undefined, null)
  t.s.stack.pop()
}

function vanishAll(t: Tracer) {
  for (const id of Object.keys(t.s.entities)) {
    if (id === APP) continue
    t.sys(id, '(gone with the process)', undefined, null)
  }
}

function openSecond(t: Tracer) {
  t.cb(SCENE2, 'scene(_:willConnectTo:options:)', 's.willConnect', 'unattached', 'note.s2.innerOnly')
  t.cb(SCENE2, 'sceneWillEnterForeground(_:)', 's.willEnterForeground', 'foregroundInactive')
  t.cb(SCENE2, 'sceneDidBecomeActive(_:)', 's.didBecomeActive', 'foregroundActive')
  t.s.secondWindow = true
  sizeChange(t, 'note.s2.resize')
}

function closeSecond(t: Tracer, noteKey?: string) {
  t.cb(SCENE2, 'sceneWillResignActive(_:)', 's.willResignActive', 'foregroundInactive', noteKey)
  t.cb(SCENE2, 'sceneDidEnterBackground(_:)', 's.didEnterBackground', 'background')
  t.cb(SCENE2, 'sceneDidDisconnect(_:)', 's.didDisconnect', null)
  t.s.secondWindow = false
}

// ── engine ─────────────────────────────────────────────────────────────────

function can(s: SimState, a: Action): Availability {
  if (a === 'toggleConfigChanges') return { ok: false, reasonKey: 'reason.androidOnly' }
  const c = commonCan(s, a)
  if (!c.ok) return c
  switch (a) {
    case 'kill':
      // A foreground-inactive app (App Switcher open) is not suspended, so jetsam won't pick it.
      return s.surface === 'recents' && !s.locked ? { ok: false, reasonKey: 'reason.iosNotSuspended' } : c
    case 'back':
      return { ok: true, noteKey: 'equiv.iosBack' }
    case 'recents':
      return { ok: true, noteKey: 'equiv.iosRecents' }
    case 'interrupt':
      return { ok: true, noteKey: 'equiv.iosInterrupt' }
  }
  return c
}

function dispatch(prev: SimState, a: Action): DispatchResult {
  const s = clone(prev)
  const t = new Tracer(s, iosLanes)
  const target = postureOf(a)

  if (target) {
    const from = s.posture
    s.posture = target
    const displayChange = (from === 'closed') !== (target === 'closed')
    if (s.secondWindow && target === 'closed') closeSecond(t, 'note.s2.closedOnFold')
    const visible = s.alive && s.surface === 'app' && !s.locked
    if (!s.alive) t.note(APP, 'note.notRunning')
    else if (!visible) t.note(SCENE, 'note.ios.resizeLater')
    else {
      if (displayChange) sizeChange(t, 'note.fold.ios')
      const hinge = target === 'closed' ? '.closed' : target === 'half' ? '.partiallyOpen' : '.fullyOpen'
      t.cb27(view(top(s)), `onHingeChange → ${hinge}`, 'sw.hinge', target === 'half' ? 'note.ios.reservedRegion' : undefined)
      t.cb27(vc(top(s)), `UIHingeInteraction → ${hinge}`, 'vc.hinge')
    }
    return { state: s, trace: t.steps }
  }

  switch (a) {
    case 'launch':
      if (!s.alive) {
        const restoring = s.restorable
        s.alive = true
        s.stack = restoring ? [...s.savedStack] : ['home']
        s.storage = {
          state: 0,
          sceneStorage: restoring ? (s.persisted.sceneStorage ?? 0) : 0,
          appStorage: s.persisted.appStorage ?? 0,
        }
        coldLaunch(t, restoring)
      } else if (s.surface === 'recents') activate(t)
      else enterForeground(t)
      s.surface = 'app'
      break
    case 'home':
      if (s.surface === 'app') resignActive(t)
      enterBackground(t)
      s.surface = 'launcher'
      break
    case 'back':
      if (top(s) === 'detail') pop(t)
      else t.note(vc(top(s)), 'note.ios.noBack')
      break
    case 'recents':
      resignActive(t, 'note.s.stillForeground')
      s.surface = 'recents'
      break
    case 'swipeAway':
      t.cb(SCENE, 'sceneDidEnterBackground(_:)', 's.didEnterBackground', 'background')
      t.cb(SCENE, 'sceneDidDisconnect(_:)', 's.didDisconnect', null, 'note.s.discarded')
      t.cb(APP, 'applicationWillTerminate(_:)', 'a.willTerminate', 'notRunning', 'note.a.willTerminateRare')
      vanishAll(t)
      s.alive = false
      s.restorable = false
      s.secondWindow = false
      s.persisted.sceneStorage = undefined
      s.storage = {}
      s.surface = 'launcher'
      break
    case 'openDetail':
      push(t)
      break
    case 'tapPlus':
      for (const h of ['state', 'sceneStorage', 'appStorage'] as const) s.storage[h] = (s.storage[h] ?? 0) + 1
      s.persisted.appStorage = s.storage.appStorage
      t.sys('HomeView', 'body re-evaluated (count changed)', 'sw.body')
      break
    case 'interrupt':
      resignActive(t, 'equiv.iosInterrupt')
      s.interrupted = true
      break
    case 'dismiss':
      activate(t)
      s.interrupted = false
      break
    case 'lock':
      if (s.surface === 'app') {
        resignActive(t)
        enterBackground(t)
      } else t.note(APP, 'note.notForeground')
      s.locked = true
      break
    case 'unlock':
      s.locked = false
      if (s.surface === 'app') enterForeground(t)
      else t.note(APP, 'note.notForeground')
      break
    case 'rotate':
      s.orientation = s.orientation === 'portrait' ? 'landscape' : 'portrait'
      sizeChange(t, 'note.rotate.ios')
      break
    case 'kill':
      t.sys(APP, 'jetsam: terminated while suspended', 'a.jetsam', 'notRunning', 'note.a.noCallback')
      vanishAll(t)
      s.alive = false
      s.secondWindow = false
      s.storage = {}
      break
    case 'newWindow':
      openSecond(t)
      break
    case 'closeWindow':
      closeSecond(t)
      sizeChange(t, 'note.s2.resize')
      break
  }
  return { state: s, trace: t.steps }
}

export const iosEngine: Engine = {
  platform: 'ios',
  lanes: iosLanes,
  holders: [
    { id: 'state', label: '@State', descKey: 'holder.state' },
    { id: 'sceneStorage', label: '@SceneStorage', descKey: 'holder.sceneStorage' },
    { id: 'appStorage', label: '@AppStorage', descKey: 'holder.appStorage' },
  ],
  initial: () => ({ ...baseState('ios'), entities: { [APP]: 'notRunning' } }),
  can,
  dispatch,
}
