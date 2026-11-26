import type { HeroClass, RelicId, TalentId, UpgradeId } from '@agent-rpg/game-core'
import type { Copy } from './types.js'

const heroClasses: Record<HeroClass, string> = {
  mage: 'Mage',
  knight: 'Knight',
  rogue: 'Rogue',
  paladin: 'Paladin',
  ranger: 'Ranger',
}

const upgrades: Copy['upgrades'] = {
  runic_anvil: { name: 'Runic Anvil', effect: '+25% party damage per level' },
  tavern_hearth: { name: 'Tavern Hearth', effect: '+30 max HP and faster healing' },
  arcane_tome: { name: 'Arcane Tome', effect: '+25% XP and gold per monster' },
  party_potion: { name: 'Party Potion', effect: 'Heals every hero to full HP now' },
}

const talents: Copy['talents'] = {
  sharpened_steel: { name: 'Sharpened Steel', effect: '×1.25 damage per level' },
  golden_touch: { name: 'Golden Touch', effect: '×1.12 gold per level' },
  scholar: { name: 'Scholar', effect: '×1.12 XP per level' },
  iron_will: { name: 'Iron Will', effect: '+10% hero max HP per level' },
  quick_start: { name: 'Quick Start', effect: '+150 starting gold per level' },
  lucky_star: { name: 'Lucky Star', effect: '+1% crit chance per level' },
}

const relics: Copy['relics'] = {
  test_totem: { name: 'Test Totem', effect: '+50% damage from test runs (Arena)' },
  scholars_lens: { name: "Scholar's Lens", effect: '+50% damage from reads and searches' },
  forge_hammer: { name: 'Forge Hammer', effect: '+50% damage from edits and writes' },
  arcane_focus: { name: 'Arcane Focus', effect: '+50% damage from subagents and MCP' },
  phoenix_feather: { name: 'Phoenix Feather', effect: 'Errors hit 30% softer' },
  skill_codex: { name: 'Skill Codex', effect: 'Skill buffs last 2 more strikes' },
  crit_dice: { name: 'Crit Dice', effect: '+8% crit chance' },
  golden_idol: { name: 'Golden Idol', effect: '+25% gold' },
  merchant_coin: { name: "Merchant's Coin", effect: 'Camp upgrades cost 15% less' },
  boss_slayer: { name: 'Boss Slayer', effect: '+30% damage against bosses' },
}

const achievements: Copy['achievements'] = {
  first_blood: { name: 'First Blood', goal: 'Defeat a monster' },
  monster_hunter: { name: 'Monster Hunter', goal: 'Defeat 100 monsters' },
  legion_slayer: { name: 'Legion Slayer', goal: 'Defeat 1,000 monsters' },
  exterminator: { name: 'Exterminator', goal: 'Defeat 10,000 monsters' },
  boss_hunter: { name: 'Boss Hunter', goal: 'Defeat 10 bosses' },
  boss_legend: { name: 'Boss Legend', goal: 'Defeat 100 bosses' },
  rift_walker: { name: 'Rift Walker', goal: 'Reach Act 10' },
  rift_diver: { name: 'Rift Diver', goal: 'Reach Act 25' },
  abyss_lord: { name: 'Abyss Lord', goal: 'Reach Act 50' },
  first_ascension: { name: 'Ascended', goal: 'Ascend once' },
  eternal: { name: 'Eternal', goal: 'Ascend 10 times' },
  relic_seeker: { name: 'Relic Seeker', goal: 'Own 3 relics' },
  relic_master: { name: 'Relic Master', goal: 'Own every relic' },
  spellbook: { name: 'Spellbook', goal: 'Use 100 skills' },
  test_marathon: { name: 'Test Marathon', goal: 'Run 500 commands or tests' },
  bookworm: { name: 'Bookworm', goal: 'Read or search 1,000 times' },
  blacksmith: { name: 'Blacksmith', goal: 'Edit or write 1,000 files' },
  battle_scarred: { name: 'Battle-Scarred', goal: 'Survive 100 errors' },
  tycoon: { name: 'Tycoon', goal: 'Earn 100,000 gold' },
  treasure_hunter: { name: 'Treasure Hunter', goal: 'Pick up 250 treasures' },
}

const achievementNames: Record<string, string> = Object.fromEntries(
  Object.entries(achievements).map(([id, a]) => [id, a.name]),
)

export const EN: Copy = {
  locale: 'en',
  languageName: 'English',
  acts: {
    setup_glade: 'Act I · Setup Glade',
    spec_woods: 'Act II · Spec Woods',
    deep_forge: 'Act III · Deep Forge',
    test_colosseum: 'Act IV · Test Colosseum',
    prod_citadel: 'Act V · Production Citadel',
  },
  actFallback: (act) => `Act ${act}`,
  endlessAct: (depth) => `Endless Rift · Depth ${depth}`,
  affixes: { armored: 'Armored', swift: 'Swift', golden: 'Golden', ancient: 'Ancient' },
  withAffix: (name, affix) => `${affix} ${name}`,
  talents,
  relics,
  questGoal: (metric, n) => {
    switch (metric) {
      case 'toolCalls':
        return `Make ${n} tool calls`
      case 'reads':
        return `Read or search ${n} times`
      case 'edits':
        return `Edit or write ${n} files`
      case 'testRuns':
        return `Run ${n} commands or tests`
      case 'skillsUsed':
        return `Use ${n} skills`
      case 'kills':
        return `Defeat ${n} monsters`
      case 'bossKills':
        return `Defeat ${n} bosses`
      case 'lootCollected':
        return `Pick up ${n} treasures`
    }
  },
  achievements,
  bossLines: {
    backlog_slime_king: {
      taunt: 'Every ticket you close spawns two more!',
      defeat: 'The backlog... shrinks... for now.',
    },
    vague_spec_wraith: {
      taunt: 'Acceptance criteria? Never heard of them.',
      defeat: 'It was... clearly specified...',
    },
    tech_debt_golem: {
      taunt: 'I was built to be refactored later. Later never comes.',
      defeat: 'Paid... in full...',
    },
    flaky_hydra: {
      taunt: 'Cut one test and two more fail at random!',
      defeat: 'Green... on the first run?!',
    },
    regression_dragon: {
      taunt: 'Every feature you ship feeds me!',
      defeat: 'I will return... with the next release.',
    },
  },

  zoneHints: {
    tavern: 'idle agents rest here',
    research: 'Read · Grep · Search',
    forge: 'Edit · Write',
    arena: 'Bash · tests · builds',
    citadel: 'Skills · subagents · MCP',
  },
  tutorial: [
    {
      title: 'Your agents are the heroes',
      lines: [
        'Every Claude Code or Antigravity session running on this machine joins the party as a hero.',
        'You do not play by hand: the game is driven by the work your agents are already doing.',
      ],
    },
    {
      title: 'Every tool is an attack',
      lines: [
        'Read, Grep, Search → Research Forest',
        'Edit, Write → Code Forge',
        'Bash, tests, builds → Test Arena',
        'Skills, subagents, MCP → Gate Citadel',
        'The balloon over a hero shows the real tool and file.',
      ],
    },
    {
      title: 'Kills summon the boss',
      lines: [
        'Each kill gives gold and XP and fills "Progress to the Boss".',
        'When it fills, the act boss appears at the Citadel and the whole party fights it.',
        'A failed command means the monster hits back: errors cost HP.',
      ],
    },
    {
      title: 'Spend, push deeper, ascend',
      lines: [
        'Gold buys upgrades in the Camp Shop. Click chests on the map for more.',
        'Each boss opens the next act. After Act V the Endless Rift never ends.',
        'Ascend to restart stronger: runes buy permanent talents.',
      ],
    },
  ],
  zones: {
    tavern: 'Village Tavern',
    research: 'Research Forest',
    forge: 'Code Forge',
    arena: 'Test Arena',
    citadel: 'Gate Citadel',
  },
  heroClasses,
  heroStates: {
    idle: 'Listening',
    moving: 'Walking',
    attacking: 'Fighting',
    casting: 'Casting a skill',
    resting: 'Resting',
  },
  sources: {
    antigravity: 'Antigravity',
    'claude-code': 'Claude Code',
    simulator: 'Demo Mode',
  },
  skills: {
    scout_radar: 'Arcane Radar',
    forge_strike: 'Forge Strike',
    arena_volley: 'Test Volley',
    arcane_bolt: 'Portal Bolt',
    summon_ally: 'Summon Ally',
    basic_strike: 'Quick Strike',
    arcane_skill: 'Arcane Skill',
  },
  monsters: {
    context_slime: 'Context Slime',
    doc_owl: 'Stale Doc Imp',
    diff_gremlin: 'Diff Gremlin',
    refactor_golem: 'Spaghetti Golem',
    lint_goblin: 'Lint Goblin',
    bug_wraith: 'Mutant Bug',
    gate_sentinel: 'Gate Sentinel',
    backlog_slime_king: 'Backlog Slime King',
    vague_spec_wraith: 'Vague Spec Wraith',
    tech_debt_golem: 'Tech Debt Golem',
    flaky_hydra: 'Flaky Test Hydra',
    regression_dragon: 'Regression Dragon',
  },
  upgrades,
  errors: {
    INSUFFICIENT_GOLD: 'Not enough gold for this upgrade.',
    UPGRADE_MAX_LEVEL: 'This upgrade is already at max level.',
    LOOT_NOT_FOUND: 'This treasure was already collected.',
    VALIDATION_ERROR: 'The server rejected an invalid command.',
    OFFLINE: 'Local server is offline. Run `npx agent-rpg` again in your terminal.',
    ASCENSION_LOCKED: 'Reach Act V in this run to ascend.',
    INSUFFICIENT_RUNES: 'Not enough runes for this talent.',
    TALENT_MAX_LEVEL: 'This talent is already at max level.',
  },
  battleLog: (entry, monster) => {
    switch (entry.code) {
      case 'hero_joined':
        return `${entry.actor} joined the party (${heroClasses[entry.detail as HeroClass] ?? entry.detail}).`
      case 'skill_buff':
        return `${entry.actor} cast the skill ${entry.detail}!`
      case 'monster_slain':
        return `${entry.actor} defeated ${monster(entry.target)} (+${entry.amount ?? 0}g).`
      case 'boss_spawned':
        return `ACT ${entry.amount ?? 1} BOSS: ${monster(entry.actor)} appeared at the Citadel!`
      case 'boss_slain':
        return `VICTORY! ${entry.actor} took down ${monster(entry.target)} (+${entry.amount ?? 0}g)!`
      case 'hero_hit':
        return `${monster(entry.target)} struck back at ${entry.actor} (-${entry.amount ?? 0} HP).`
      case 'hero_knocked_out':
        return `${entry.actor} was knocked out and retreated to the Tavern.`
      case 'upgrade_bought':
        return `Camp upgraded: ${upgrades[entry.actor as UpgradeId]?.name ?? entry.actor} (-${entry.amount ?? 0}g).`
      case 'loot_collected':
        return `Treasure collected (+${entry.amount ?? 0}g)!`
      case 'campaign_victory':
        return `ACT V CLEARED! ${entry.actor} defeated the Regression Dragon. The Endless Rift opens!`
      case 'ascended':
        return `The party ascended from Act ${entry.detail ?? '?'} and earned ${entry.amount ?? 0} runes!`
      case 'talent_bought':
        return `Talent learned: ${talents[entry.actor as TalentId]?.name ?? entry.actor} (Lv.${entry.amount ?? 1}).`
      case 'relic_found':
        return `RELIC! ${entry.actor} found the ${relics[entry.detail as RelicId]?.name ?? entry.detail}.`
      case 'relic_duplicate':
        return `${entry.actor} found a known relic and melted it into ${entry.amount ?? 0} runes.`
      case 'quest_completed':
        return `Quest complete (${entry.detail === 'weekly' ? 'weekly' : 'daily'}): +${entry.amount ?? 0} runes and gold!`
      case 'achievement_unlocked':
        return `Achievement: ${achievementNames[entry.actor] ?? entry.actor} (+${entry.amount ?? 0} runes)!`
    }
  },
  ui: {
    connecting: 'Connecting to the local Tavern...',
    retry: 'Try again',
    partyLevel: 'PARTY LV',
    gold: 'GOLD',
    kills: 'KILLS',
    demoOn: 'Demo: ON',
    demoOff: 'Demo Mode',
    summonRaid: 'Summon Raid',
    soundOn: 'Sound: ON',
    soundOff: 'Sound: OFF',
    reset: 'Reset',
    live: '● LIVE',
    offline: '○ OFFLINE',
    simulator: 'Simulator',
    boss: 'BOSS',
    bossProgress: 'Progress to the Boss',
    languageToggleLabel: 'Mudar para português',
    heroInspector: 'HERO INSPECTOR',
    levelShort: 'Lv.',
    zone: 'Zone',
    skill: 'Skill',
    activeBuff: 'Active buff',
    tool: 'Tool',
    file: 'File',
    killsDamage: 'Kills / Damage',
    noHeroYet: 'No active agents yet. Click a hero on the map to inspect what it is doing.',
    party: 'PARTY',
    tavernWaiting: 'The Tavern is waiting for agents...',
    battleLogTitle: 'BATTLE LOG',
    battleLogEmpty: 'Your agents’ deeds will show up here.',
    noSkill: 'None',
    shopTitle: 'CAMP SHOP',
    shopHint: 'Click coins and chests on the map to collect gold',
    uses: 'Uses',
    max: 'MAX',
    bestiary: 'BESTIARY',
    bestiaryEmpty: 'No monsters recorded yet.',
    monsterFallback: 'Monster',
    victoryTitle: 'ACT V CLEARED!',
    victoryBody:
      'The Regression Dragon falls, and the Endless Rift opens behind it. Keep going deeper, or ascend now to trade this run for runes.',
    victoryPartyLevel: 'Party Level',
    victoryKills: 'Monsters Slain',
    victoryGold: 'Gold Earned',
    victoryEvents: 'Real Events',
    keepGoing: 'Keep going',
    runes: 'RUNES',
    ascensionBadge: (n) => `✦ Ascension ${n}`,
    ascensionTitle: 'ASCENSION',
    ascensionHint: 'Ascending restarts the run at Act 1 for runes. Talents, relics and achievements stay forever.',
    ascendButton: (runes) => `Ascend: +${runes} runes`,
    ascendLocked: (act) => `Reach Act ${act} to ascend`,
    ascendConfirm: (runes) => `Ascend now for ${runes} runes? Level, gold and camp upgrades restart.`,
    talentsTitle: 'TALENTS',
    buyOne: 'Buy',
    buyMax: 'Max',
    trophiesTitle: 'TROPHIES',
    relicsTitle: (owned, total) => `Relics ${owned}/${total}`,
    unknownRelic: 'Undiscovered relic',
    achievementsTitle: (unlocked, total) => `Achievements ${unlocked}/${total}`,
    questsTitle: 'QUESTS',
    daily: 'Daily',
    weekly: 'Weekly',
    questReward: (runes) => `+${runes} runes + gold`,
    questDone: 'Done!',
    resetConfirm: 'Hard reset deletes the run AND all runes, talents, relics and achievements. Continue?',
    bossIncoming: '⚠ BOSS INCOMING ⚠',
    bossDefeated: '★ BOSS DEFEATED ★',
    relicFound: '✦ RELIC FOUND ✦',
    canvasEmpty: 'The Tavern is quiet. Start a Claude Code or Antigravity agent, or turn on Demo Mode to watch the party fight!',
    canvasLabel: 'Agent RPG world map. Click heroes to inspect them and treasures to collect gold.',
    activityTitle: 'Live activity',
    activityEmpty: 'Nothing yet. Each tool your agents call shows up here.',
    activityHit: (action, damage, monster) => `${action} → ${damage} dmg on ${monster}`,
    activityFailed: (action, monster) => `${action} failed → ${monster} hit back`,
    help: 'How to play',
    tutorialStep: (current, total) => `${current} / ${total}`,
    tutorialBack: 'Back',
    tutorialNext: 'Next',
    tutorialDone: 'Got it!',
    tutorialSkip: 'Skip',
  },
}
