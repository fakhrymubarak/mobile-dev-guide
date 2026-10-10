import { androidEngine } from './android'
import { iosEngine } from './ios'
import type { Engine, Platform } from './types'

export const engines: Record<Platform, Engine> = { android: androidEngine, ios: iosEngine }
export * from './types'
