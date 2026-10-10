import { describe, expect, it } from 'vitest'
import { androidEngine as E } from './android'
import { callbacks, run } from './testkit'

describe('Android Activity lifecycle', () => {
  it('cold start goes outside-in: Activity → Fragment → composable', () => {
    const { state, trace } = run(E, ['launch'])
    expect(callbacks(trace)).toEqual([
      'MainActivity.onCreate(savedInstanceState = null)',
      'HomeFragment.onAttach(context)',
      'HomeFragment.onCreate(savedInstanceState)',
      'HomeFragment.onCreateView(…)',
      'HomeFragment.onViewCreated(view, …)',
      'HomeScreen.enters composition',
      'MainActivity.onStart()',
      'HomeFragment.onStart()',
      'HomeScreen.LifecycleStartEffect { onStart }',
      'MainActivity.onResume()',
      'HomeFragment.onResume()',
      'HomeScreen.LifecycleResumeEffect { onResume }',
    ])
    expect(state.entities).toMatchObject({ process: 'foreground', MainActivity: 'resumed', HomeFragment: 'resumed', HomeScreen: 'resumed' })
  })

  it('Home stops (inside-out) and saves state, but does not destroy', () => {
    const { state, trace } = run(E, ['launch', 'home'])
    expect(callbacks(trace)).toEqual([
      'HomeScreen.onPauseOrDispose { }',
      'HomeFragment.onPause()',
      'MainActivity.onPause()',
      'HomeScreen.onStopOrDispose { }',
      'HomeFragment.onStop()',
      'MainActivity.onStop()',
      'MainActivity.onSaveInstanceState(outState)',
    ])
    expect(state.entities.MainActivity).toBe('created')
    expect(state.entities.process).toBe('background')
  })

  it('returning from Home goes through onRestart', () => {
    const { trace } = run(E, ['launch', 'home', 'launch'])
    expect(callbacks(trace)[0]).toBe('MainActivity.onRestart()')
    expect(callbacks(trace)).not.toContain('MainActivity.onCreate(savedInstanceState = null)')
  })

  it('a partial interruption only pauses', () => {
    const { state, trace } = run(E, ['launch', 'interrupt'])
    expect(callbacks(trace)).toEqual(['HomeScreen.onPauseOrDispose { }', 'HomeFragment.onPause()', 'MainActivity.onPause()'])
    expect(state.entities.MainActivity).toBe('started')
    expect(E.can(state, 'home')).toEqual({ ok: false, reasonKey: 'reason.dismissFirst' })
    expect(callbacks(run(E, ['dismiss'], state).trace)).toContain('MainActivity.onResume()')
  })

  it('Back on the root activity (Android 12+) stops it instead of destroying it', () => {
    const { state, trace } = run(E, ['launch', 'back'])
    expect(callbacks(trace)).toContain('MainActivity.onStop()')
    expect(callbacks(trace).some((c) => c.includes('onDestroy'))).toBe(false)
    expect(state.surface).toBe('launcher')
  })
})

describe('configuration changes', () => {
  it('rotation recreates the Activity: ViewModel + rememberSaveable survive, remember is lost', () => {
    const { state, trace } = run(E, ['launch', 'tapPlus', 'tapPlus', 'rotate'])
    const cbs = callbacks(trace)
    expect(cbs.indexOf('MainActivity.onDestroy()')).toBeLessThan(cbs.indexOf('MainActivity.onCreate(savedInstanceState = Bundle)'))
    expect(trace.find((s) => s.label === 'onDestroy()' && s.entity === 'MainActivity')?.noteKey).toBe('note.a.changingConfig')
    expect(state.storage).toEqual({ remember: 0, rememberSaveable: 2, viewModel: 2, dataStore: 2 })
    expect(state.orientation).toBe('landscape')
  })

  it('with configChanges handled, only onConfigurationChanged fires', () => {
    const { state, trace } = run(E, ['launch', 'tapPlus', 'toggleConfigChanges', 'rotate'])
    expect(callbacks(trace)).toEqual(['MainActivity.onConfigurationChanged(newConfig)'])
    expect(state.storage.remember).toBe(1)
  })

  it('unfolding recreates and reports a FoldingFeature', () => {
    const { trace } = run(E, ['launch', 'postureOpen'])
    expect(callbacks(trace)).toContain('MainActivity.onCreate(savedInstanceState = Bundle)')
    expect(trace.at(-1)?.label).toBe('FoldingFeature(state = FLAT)')
  })

  it('half-opening (tabletop) does not change configuration', () => {
    const { trace } = run(E, ['launch', 'postureOpen', 'postureHalf'])
    expect(callbacks(trace)).toEqual([])
    expect(trace[0].label).toBe('FoldingFeature(state = HALF_OPENED)')
  })

  it('folding while stopped defers recreation until the app returns', () => {
    const { trace } = run(E, ['launch', 'home', 'postureOpen', 'launch'])
    const cbs = callbacks(trace)
    expect(cbs).not.toContain('MainActivity.onRestart()')
    expect(cbs).toContain('MainActivity.onDestroy()')
    expect(cbs).toContain('MainActivity.onCreate(savedInstanceState = Bundle)')
  })
})

describe('fragments and the back stack', () => {
  it('navigating forward destroys the previous fragment view but keeps the instance', () => {
    const { state, trace } = run(E, ['launch', 'tapPlus', 'openDetail'])
    expect(callbacks(trace)).toContain('HomeFragment.onDestroyView()')
    expect(callbacks(trace)).not.toContain('HomeFragment.onDestroy()')
    expect(state.entities.HomeFragment).toBe('created')
    expect(state.entities.HomeScreen).toBeUndefined()
    expect(state.storage).toMatchObject({ remember: 0, rememberSaveable: 1, viewModel: 1 })
  })

  it('Back pops the detail fragment and recreates the home view', () => {
    const { state, trace } = run(E, ['launch', 'openDetail', 'back'])
    expect(callbacks(trace)).toContain('HomeFragment.onCreateView(…)')
    expect(callbacks(trace)).toContain('DetailFragment.onDestroy()')
    expect(state.stack).toEqual(['home'])
    expect(state.entities.DetailFragment).toBeUndefined()
  })
})

describe('process death', () => {
  it('low-memory kill fires no callbacks; relaunch restores the back stack and rememberSaveable', () => {
    const killed = run(E, ['launch', 'tapPlus', 'tapPlus', 'tapPlus', 'openDetail', 'home', 'kill'])
    expect(callbacks(killed.trace)).toEqual([])
    expect(killed.state.alive).toBe(false)
    const { state, trace } = run(E, ['launch'], killed.state)
    expect(callbacks(trace)[0]).toBe('MainActivity.onCreate(savedInstanceState = Bundle)')
    expect(state.stack).toEqual(['home', 'detail'])
    expect(state.storage).toEqual({ remember: 0, viewModel: 0, rememberSaveable: 3, dataStore: 3 })
  })

  it('swiping away from Recents discards saved state (only DataStore persists)', () => {
    const { state } = run(E, ['launch', 'tapPlus', 'recents', 'swipeAway', 'launch'])
    expect(state.stack).toEqual(['home'])
    expect(state.storage).toEqual({ remember: 0, viewModel: 0, rememberSaveable: 0, dataStore: 1 })
  })

  it('cannot kill a foreground app', () => {
    expect(E.can(run(E, ['launch']).state, 'kill')).toEqual({ ok: false, reasonKey: 'reason.notInBackground' })
  })
})

describe('multi-window', () => {
  it('a second window resizes the first and multi-resumes both', () => {
    const { state, trace } = run(E, ['launch', 'postureOpen', 'newWindow'])
    expect(callbacks(trace)).toContain('MainActivity#2.onResume()')
    expect(state.entities).toMatchObject({ MainActivity: 'resumed', 'MainActivity#2': 'resumed' })
  })

  it('new windows need the inner display', () => {
    expect(E.can(run(E, ['launch']).state, 'newWindow')).toEqual({ ok: false, reasonKey: 'reason.innerOnly' })
  })

  it('folding closed ends the split', () => {
    const { state } = run(E, ['launch', 'postureOpen', 'newWindow', 'postureClosed'])
    expect(state.secondWindow).toBe(false)
    expect(state.entities['MainActivity#2']).toBeUndefined()
  })
})
