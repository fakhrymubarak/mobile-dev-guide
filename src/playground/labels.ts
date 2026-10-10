import type { TFunction } from 'i18next'
import type { Action, Platform } from '../engine'

/** Platform-specific action names fall back to the shared one ("Back" vs "Swipe back"). */
export function actionLabel(t: TFunction, platform: Platform, action: Action) {
  return t([`action.${platform}.${action}`, `action.${action}`])
}
