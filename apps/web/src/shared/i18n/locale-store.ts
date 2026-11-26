import { useSyncExternalStore } from 'react'
import { STORY_ACTS, type GameSnapshot, type MonsterAffix } from '@agent-rpg/game-core'
import { EN } from './en.js'
import { PT_BR } from './pt-br.js'
import { LOCALES, type Copy, type Locale } from './types.js'

const STORAGE_KEY = 'agent-rpg.locale'
const COPIES: Readonly<Record<Locale, Copy>> = { en: EN, 'pt-BR': PT_BR }
const listeners = new Set<() => void>()

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

function readStoredLocale(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

/** Saved choice first, then a Portuguese browser gets pt-BR, everyone else English. */
export function detectLocale(stored: string | null, browserLanguage: string | undefined): Locale {
  if (isLocale(stored)) return stored
  return browserLanguage?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

let current: Locale = detectLocale(readStoredLocale(), globalThis.navigator?.language)

export function getLocale(): Locale {
  return current
}

/** Returns the copy of the active locale. Canvas renderers call it every frame. */
export function getCopy(): Copy {
  return COPIES[current]
}

export function setLocale(next: Locale): void {
  if (next === current) return
  current = next
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next)
  } catch {
    // Storage blocked (private window): the choice lasts until the tab closes.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next
  for (const listener of listeners) listener()
}

export function toggleLocale(): void {
  setLocale(current === 'en' ? 'pt-BR' : 'en')
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: re-renders the component when the locale changes. */
export function useCopy(): Copy {
  return useSyncExternalStore(subscribe, getCopy, getCopy)
}

export function getMonsterLabel(
  copy: Copy,
  templateId: string | undefined,
  affix: MonsterAffix | null = null,
): string {
  const name = templateId ? (copy.monsters[templateId] ?? templateId) : copy.ui.monsterFallback
  return affix ? copy.withAffix(name, copy.affixes[affix]) : name
}

export function getActTitle(copy: Copy, campaign: GameSnapshot['campaign']): string {
  if (campaign.act > STORY_ACTS) return copy.endlessAct(campaign.act - STORY_ACTS)
  return copy.acts[campaign.actId] ?? copy.actFallback(campaign.act)
}

export function getSkillLabel(copy: Copy, skillKey: string | null): string {
  if (!skillKey) return copy.ui.noSkill
  return copy.skills[skillKey] ?? skillKey
}
