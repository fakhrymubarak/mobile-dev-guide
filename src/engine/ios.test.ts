import { describe, expect, it } from 'vitest'
import { iosEngine as E } from './ios'
import { callbacks, run } from './testkit'

describe('iOS app & scene lifecycle', () => {
  it('cold launch: app → scene → view controller → SwiftUI', () => {
    const { state, trace } = run(E, ['launch'])
    expect(callbacks(trace)).toEqual([
      'app.application(_:didFinishLaunchingWithOptions:)',
      'scene.scene(_:willConnectTo:options:)',
      'HomeVC.viewDidLoad()',
      'scene.sceneWillEnterForeground(_:)',
      'scenePhase.onChange(of: scenePhase) → .inactive',
      'HomeVC.viewWillAppear(_:)',
      'HomeVC.viewIsAppearing(_:)',
      'HomeView..onAppear { }',
      'scene.sceneDidBecomeActive(_:)',
      'scenePhase.onChange(of: scenePhase) → .active',
      'HomeVC.viewDidAppear(_:)',
    ])
    expect(state.entities).toMatchObject({ app: 'active', scene: 'foregroundActive', HomeVC: 'appeared', scenePhase: 'active' })
  })

  it('Home backgrounds and suspends — view controllers get NO disappear callbacks', () => {
    const { state, trace } = run(E, ['launch', 'home'])
    expect(callbacks(trace)).toEqual([
      'scene.sceneWillResignActive(_:)',
      'scenePhase.onChange(of: scenePhase) → .inactive',
      'scene.sceneDidEnterBackground(_:)',
      'scenePhase.onChange(of: scenePhase) → .background',
    ])
    expect(state.entities).toMatchObject({ app: 'suspended', HomeVC: 'appeared', HomeView: 'appeared' })
  })

  it('returning from Home: willEnterForeground → didBecomeActive, no viewWillAppear', () => {
    const { trace } = run(E, ['launch', 'home', 'launch'])
    expect(callbacks(trace)).toEqual([
      'scene.sceneWillEnterForeground(_:)',
      'scenePhase.onChange(of: scenePhase) → .inactive',
      'scene.sceneDidBecomeActive(_:)',
      'scenePhase.onChange(of: scenePhase) → .active',
    ])
  })

  it('App Switcher only makes the scene inactive (it stays in the foreground)', () => {
    const { state } = run(E, ['launch', 'recents'])
    expect(state.entities.scene).toBe('foregroundInactive')
    expect(E.can(state, 'kill')).toEqual({ ok: false, reasonKey: 'reason.iosNotSuspended' })
  })

  it('Control Center: resign active, then become active again', () => {
    const r = run(E, ['launch', 'interrupt'])
    expect(r.state.entities.scene).toBe('foregroundInactive')
    expect(callbacks(run(E, ['dismiss'], r.state).trace)[0]).toBe('scene.sceneDidBecomeActive(_:)')
  })
})

describe('size changes never restart anything on iOS', () => {
  it('rotation: trait/size callbacks only, @State survives', () => {
    const { state, trace } = run(E, ['launch', 'tapPlus', 'rotate'])
    expect(callbacks(trace)).toEqual([
      'scene.windowScene(_:didUpdate:interfaceOrientation:traitCollection:)',
      'HomeVC.viewWillTransition(to:with:)',
      'HomeVC.registerForTraitChanges { … }',
    ])
    expect(state.storage.state).toBe(1)
  })

  it('iPhone Duo unfold: resize + hinge APIs (iOS 27.1)', () => {
    const { trace } = run(E, ['launch', 'postureOpen'])
    expect(callbacks(trace)).toContain('HomeView.onHingeChange → .fullyOpen')
    expect(trace.filter((s) => s.badge === 'ios27')).toHaveLength(2)
  })

  it('half fold: hinge only, with the reserved region note', () => {
    const { trace } = run(E, ['launch', 'postureOpen', 'postureHalf'])
    expect(callbacks(trace)).toEqual(['HomeView.onHingeChange → .partiallyOpen', 'HomeVC.UIHingeInteraction → .partiallyOpen'])
    expect(trace[0].noteKey).toBe('note.ios.reservedRegion')
  })
})

describe('navigation', () => {
  it('push: the previous screen disappears but stays alive', () => {
    const { state, trace } = run(E, ['launch', 'tapPlus', 'openDetail'])
    expect(callbacks(trace)).toContain('HomeVC.viewDidDisappear(_:)')
    expect(state.entities.HomeVC).toBe('disappeared')
    expect(state.storage.state).toBe(1)
  })

  it('swipe back pops and deinits the detail controller', () => {
    const { state, trace } = run(E, ['launch', 'openDetail', 'back'])
    expect(callbacks(trace).at(-1)).toBe('DetailVC.deinit')
    expect(state.entities.DetailVC).toBeUndefined()
  })

  it('Back at the root does nothing (no system Back on iOS)', () => {
    const { state, trace } = run(E, ['launch', 'back'])
    expect(callbacks(trace)).toEqual([])
    expect(trace[0].noteKey).toBe('note.ios.noBack')
    expect(state.surface).toBe('app')
  })
})

describe('termination', () => {
  it('jetsam kill is silent; relaunch restores @SceneStorage and the nav stack', () => {
    const killed = run(E, ['launch', 'tapPlus', 'tapPlus', 'openDetail', 'home', 'kill'])
    expect(callbacks(killed.trace)).toEqual([])
    const { state, trace } = run(E, ['launch'], killed.state)
    expect(trace[1].noteKey).toBe('note.s.restoring')
    expect(state.stack).toEqual(['home', 'detail'])
    expect(state.storage).toEqual({ state: 0, sceneStorage: 2, appStorage: 2 })
  })

  it('swiping away discards scene state; @AppStorage persists', () => {
    const { state } = run(E, ['launch', 'tapPlus', 'recents', 'swipeAway', 'launch'])
    expect(state.storage).toEqual({ state: 0, sceneStorage: 0, appStorage: 1 })
  })

  it('configChanges is Android-only', () => {
    expect(E.can(E.initial(), 'toggleConfigChanges')).toEqual({ ok: false, reasonKey: 'reason.androidOnly' })
  })
})

describe('multiple windows on iPhone Duo', () => {
  it('a second scene connects on the inner display', () => {
    const { state } = run(E, ['launch', 'postureOpen', 'newWindow'])
    expect(state.entities['scene#2']).toBe('foregroundActive')
  })

  it('folding closed disconnects the second scene', () => {
    const { state } = run(E, ['launch', 'postureOpen', 'newWindow', 'postureClosed'])
    expect(state.entities['scene#2']).toBeUndefined()
  })
})
