import type { GameSnapshot } from '../contracts/game-snapshot.js'
import { ACHIEVEMENTS, getAchievementValue } from './achievements.js'
import { pushLog } from './combat-helpers.js'
import { getQuestProgress, questGoldReward, refreshQuestBoard } from './quests.js'

/**
 * Settles everything that depends on accumulated progress: rolls quests over, pays finished
 * quests and unlocks achievements. Every state-changing entry point calls it last.
 */
export function settleProgress(state: GameSnapshot, nowIso: string): GameSnapshot {
  let next: GameSnapshot = { ...state, quests: refreshQuestBoard(state, nowIso) }

  const active = next.quests.active.map((quest) => {
    if (quest.completed || getQuestProgress(next, quest) < quest.target) return quest
    const gold = questGoldReward(quest.cadence, next.campaign.act)
    next = {
      ...next,
      party: { ...next.party, gold: next.party.gold + gold, totalGoldEarned: next.party.totalGoldEarned + gold },
      meta: {
        ...next.meta,
        runes: next.meta.runes + quest.rewardRunes,
        totalRunesEarned: next.meta.totalRunesEarned + quest.rewardRunes,
      },
      battleLog: pushLog(next.battleLog, {
        id: `log-quest-${quest.id}`,
        timestamp: nowIso,
        code: 'quest_completed',
        actor: quest.metric,
        detail: quest.cadence,
        amount: quest.rewardRunes,
      }),
    }
    return { ...quest, completed: true }
  })
  next = { ...next, quests: { ...next.quests, active } }

  for (const achievement of ACHIEVEMENTS) {
    if (next.meta.achievements.includes(achievement.id)) continue
    if (getAchievementValue(next, achievement.source) < achievement.threshold) continue
    next = {
      ...next,
      meta: {
        ...next.meta,
        achievements: [...next.meta.achievements, achievement.id],
        runes: next.meta.runes + achievement.runes,
        totalRunesEarned: next.meta.totalRunesEarned + achievement.runes,
      },
      battleLog: pushLog(next.battleLog, {
        id: `log-ach-${achievement.id}`,
        timestamp: nowIso,
        code: 'achievement_unlocked',
        actor: achievement.id,
        amount: achievement.runes,
      }),
    }
  }

  return next
}
