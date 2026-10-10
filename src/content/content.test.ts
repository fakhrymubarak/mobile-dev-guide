import { describe, expect, it } from 'vitest'
import { engines } from '../engine'
import type { Action } from '../engine'
import { en } from '../i18n/en'
import { allCids } from './snippets'

const ACTIONS: Action[] = [
  'launch', 'home', 'back', 'recents', 'swipeAway', 'openDetail', 'tapPlus', 'interrupt', 'dismiss', 'lock', 'unlock',
  'rotate', 'kill', 'postureClosed', 'postureHalf', 'postureOpen', 'newWindow', 'closeWindow', 'toggleConfigChanges',
]

/** Random walk through every engine collecting every cid / note / reason the UI could show. */
function explore() {
  const cids = new Set<string>()
  const keys = new Set<string>()
  for (const engine of Object.values(engines)) {
    for (const lane of engine.lanes) keys.add(lane.titleKey)
    for (const h of engine.holders) keys.add(h.descKey)
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let walk = 0; walk < 300; walk++) {
      let s = engine.initial()
      for (let i = 0; i < 40; i++) {
        const a = ACTIONS[Math.floor(rand() * ACTIONS.length)]
        const ok = engine.can(s, a)
        if (!ok.ok) { keys.add(ok.reasonKey); continue }
        if (ok.noteKey) keys.add(ok.noteKey)
        const r = engine.dispatch(s, a)
        for (const step of r.trace) {
          if (step.cid) cids.add(step.cid)
          if (step.noteKey) keys.add(step.noteKey)
        }
        s = r.state
      }
    }
  }
  return { cids, keys }
}

describe('content coverage', () => {
  const { cids, keys } = explore()
  it('every cid the engines emit has an explanation and a snippet', () => {
    expect(cids.size).toBeGreaterThan(50)
    for (const cid of cids) {
      expect(en, cid).toHaveProperty([`x.${cid}`])
      expect(allCids, cid).toContain(cid)
    }
  })
  it('every note / reason / lane key exists', () => {
    for (const k of keys) expect(en, k).toHaveProperty([k])
  })
})
