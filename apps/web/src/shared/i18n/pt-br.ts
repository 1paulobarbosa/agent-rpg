import type { HeroClass, RelicId, TalentId, UpgradeId } from '@agent-rpg/game-core'
import type { Copy } from './types.js'

const heroClasses: Record<HeroClass, string> = {
  mage: 'Mago',
  knight: 'Guerreiro',
  rogue: 'Ladino',
  paladin: 'Paladino',
  ranger: 'Arqueiro',
}

const upgrades: Copy['upgrades'] = {
  runic_anvil: { name: 'Bigorna Rúnica', effect: '+25% dano da party por nível' },
  tavern_hearth: { name: 'Fogueira da Taverna', effect: '+30 HP máximo e cura mais rápida' },
  arcane_tome: { name: 'Grimório Arcano', effect: '+25% XP e ouro por monstro' },
  party_potion: { name: 'Poção de Grupo', effect: 'Cura 100% do HP de todos os heróis agora' },
}

const talents: Copy['talents'] = {
  sharpened_steel: { name: 'Aço Afiado', effect: '×1,25 de dano por nível' },
  golden_touch: { name: 'Toque Dourado', effect: '×1,12 de ouro por nível' },
  scholar: { name: 'Erudito', effect: '×1,12 de XP por nível' },
  iron_will: { name: 'Vontade de Ferro', effect: '+10% de HP máximo por nível' },
  quick_start: { name: 'Largada Rápida', effect: '+150 de ouro inicial por nível' },
  lucky_star: { name: 'Estrela da Sorte', effect: '+1% de chance de crítico por nível' },
}

const relics: Copy['relics'] = {
  test_totem: { name: 'Totem dos Testes', effect: '+50% de dano ao rodar testes (Arena)' },
  scholars_lens: { name: 'Lente do Erudito', effect: '+50% de dano em leituras e buscas' },
  forge_hammer: { name: 'Martelo da Forja', effect: '+50% de dano em edições' },
  arcane_focus: { name: 'Foco Arcano', effect: '+50% de dano de subagentes e MCP' },
  phoenix_feather: { name: 'Pena de Fênix', effect: 'Erros machucam 30% menos' },
  skill_codex: { name: 'Códice de Skills', effect: 'Buffs de skill duram 2 golpes a mais' },
  crit_dice: { name: 'Dado Crítico', effect: '+8% de chance de crítico' },
  golden_idol: { name: 'Ídolo Dourado', effect: '+25% de ouro' },
  merchant_coin: { name: 'Moeda do Mercador', effect: 'Upgrades do acampamento 15% mais baratos' },
  boss_slayer: { name: 'Matador de Chefes', effect: '+30% de dano contra chefes' },
}

const achievements: Copy['achievements'] = {
  first_blood: { name: 'Primeiro Sangue', goal: 'Derrote um monstro' },
  monster_hunter: { name: 'Caçador de Monstros', goal: 'Derrote 100 monstros' },
  legion_slayer: { name: 'Matador de Legiões', goal: 'Derrote 1.000 monstros' },
  exterminator: { name: 'Exterminador', goal: 'Derrote 10.000 monstros' },
  boss_hunter: { name: 'Caçador de Chefes', goal: 'Derrote 10 chefes' },
  boss_legend: { name: 'Lenda dos Chefes', goal: 'Derrote 100 chefes' },
  rift_walker: { name: 'Andarilho da Fenda', goal: 'Chegue ao Ato 10' },
  rift_diver: { name: 'Mergulhador da Fenda', goal: 'Chegue ao Ato 25' },
  abyss_lord: { name: 'Senhor do Abismo', goal: 'Chegue ao Ato 50' },
  first_ascension: { name: 'Ascendido', goal: 'Ascenda uma vez' },
  eternal: { name: 'Eterno', goal: 'Ascenda 10 vezes' },
  relic_seeker: { name: 'Buscador de Relíquias', goal: 'Tenha 3 relíquias' },
  relic_master: { name: 'Mestre das Relíquias', goal: 'Tenha todas as relíquias' },
  spellbook: { name: 'Grimório Vivo', goal: 'Use 100 skills' },
  test_marathon: { name: 'Maratona de Testes', goal: 'Rode 500 comandos ou testes' },
  bookworm: { name: 'Rato de Biblioteca', goal: 'Leia ou busque 1.000 vezes' },
  blacksmith: { name: 'Ferreiro', goal: 'Edite ou escreva 1.000 arquivos' },
  battle_scarred: { name: 'Cicatrizes de Batalha', goal: 'Sobreviva a 100 erros' },
  tycoon: { name: 'Magnata', goal: 'Ganhe 100.000 de ouro' },
  treasure_hunter: { name: 'Caçador de Tesouros', goal: 'Pegue 250 tesouros' },
}

const achievementNames: Record<string, string> = Object.fromEntries(
  Object.entries(achievements).map(([id, a]) => [id, a.name]),
)

export const PT_BR: Copy = {
  locale: 'pt-BR',
  languageName: 'Português',
  acts: {
    setup_glade: 'Ato I · Clareira do Setup',
    spec_woods: 'Ato II · Bosque das Specs',
    deep_forge: 'Ato III · Forja Profunda',
    test_colosseum: 'Ato IV · Coliseu dos Testes',
    prod_citadel: 'Ato V · Cidadela de Produção',
  },
  actFallback: (act) => `Ato ${act}`,
  endlessAct: (depth) => `Fenda Infinita · Profundidade ${depth}`,
  affixes: { armored: 'Blindado', swift: 'Veloz', golden: 'Dourado', ancient: 'Ancestral' },
  withAffix: (name, affix) => `${name} ${affix}`,
  talents,
  relics,
  questGoal: (metric, n) => {
    switch (metric) {
      case 'toolCalls':
        return `Faça ${n} chamadas de ferramenta`
      case 'reads':
        return `Leia ou busque ${n} vezes`
      case 'edits':
        return `Edite ou escreva ${n} arquivos`
      case 'testRuns':
        return `Rode ${n} comandos ou testes`
      case 'skillsUsed':
        return `Use ${n} skills`
      case 'kills':
        return `Derrote ${n} monstros`
      case 'bossKills':
        return `Derrote ${n} chefes`
      case 'lootCollected':
        return `Pegue ${n} tesouros`
    }
  },
  achievements,
  bossLines: {
    backlog_slime_king: {
      taunt: 'Cada ticket que você fecha gera mais dois!',
      defeat: 'O backlog... encolheu... por enquanto.',
    },
    vague_spec_wraith: {
      taunt: 'Critério de aceite? Nunca ouvi falar.',
      defeat: 'Estava... claramente especificado...',
    },
    tech_debt_golem: {
      taunt: 'Fui feito para ser refatorado depois. O depois nunca chega.',
      defeat: 'Pago... integralmente...',
    },
    flaky_hydra: {
      taunt: 'Corte um teste e outros dois falham ao acaso!',
      defeat: 'Verde... de primeira?!',
    },
    regression_dragon: {
      taunt: 'Cada feature que você entrega me alimenta!',
      defeat: 'Eu voltarei... no próximo release.',
    },
  },

  zoneHints: {
    tavern: 'agentes parados descansam aqui',
    research: 'Read · Grep · Busca',
    forge: 'Edit · Write',
    arena: 'Bash · testes · builds',
    citadel: 'Skills · subagentes · MCP',
  },
  tutorial: [
    {
      title: 'Seus agentes são os heróis',
      lines: [
        'Cada sessão do Claude Code ou do Antigravity rodando nesta máquina entra na party como um herói.',
        'Você não joga na mão: o jogo é movido pelo trabalho que seus agentes já estão fazendo.',
      ],
    },
    {
      title: 'Cada ferramenta é um ataque',
      lines: [
        'Read, Grep, Busca → Floresta da Pesquisa',
        'Edit, Write → Forja de Código',
        'Bash, testes, builds → Arena de Testes',
        'Skills, subagentes, MCP → Cidadela do Gate',
        'O balão sobre o herói mostra a ferramenta e o arquivo reais.',
      ],
    },
    {
      title: 'Kills chamam o chefe',
      lines: [
        'Cada kill dá ouro e XP e enche o "Progresso até o Chefe".',
        'Quando enche, o chefe do ato aparece na Cidadela e a party inteira luta contra ele.',
        'Comando que falha faz o monstro revidar: erro custa HP.',
      ],
    },
    {
      title: 'Gaste, avance, ascenda',
      lines: [
        'Ouro compra upgrades na Loja do Acampamento. Clique nos baús do mapa para ganhar mais.',
        'Cada chefe abre o próximo ato. Depois do Ato V, a Fenda Infinita não acaba.',
        'Ascenda para recomeçar mais forte: runas compram talentos permanentes.',
      ],
    },
  ],
  zones: {
    tavern: 'Taverna da Vila',
    research: 'Floresta da Pesquisa',
    forge: 'Forja de Código',
    arena: 'Arena de Testes',
    citadel: 'Cidadela do Gate',
  },
  heroClasses,
  heroStates: {
    idle: 'Na escuta',
    moving: 'Caminhando',
    attacking: 'Em combate',
    casting: 'Conjurando skill',
    resting: 'Descansando',
  },
  sources: {
    antigravity: 'Antigravity',
    'claude-code': 'Claude Code',
    simulator: 'Modo Demo',
  },
  skills: {
    scout_radar: 'Radar Arcano',
    forge_strike: 'Golpe de Forja',
    arena_volley: 'Saraivada de Testes',
    arcane_bolt: 'Raio do Portal',
    summon_ally: 'Invocar Aliado',
    basic_strike: 'Golpe Rápido',
    arcane_skill: 'Skill Arcana',
  },
  monsters: {
    context_slime: 'Slime de Contexto',
    doc_owl: 'Diabrete de Docs',
    diff_gremlin: 'Gremlin de Diff',
    refactor_golem: 'Golem Espaguete',
    lint_goblin: 'Goblin de Lint',
    bug_wraith: 'Bug Mutante',
    gate_sentinel: 'Sentinela do Gate',
    backlog_slime_king: 'Slime Rei do Backlog',
    vague_spec_wraith: 'Espectro do Requisito Vago',
    tech_debt_golem: 'Golem do Débito Técnico',
    flaky_hydra: 'Hidra do Teste Flaky',
    regression_dragon: 'Dragão da Regressão',
  },
  upgrades,
  errors: {
    INSUFFICIENT_GOLD: 'Ouro insuficiente para este upgrade.',
    UPGRADE_MAX_LEVEL: 'Este upgrade já está no nível máximo.',
    LOOT_NOT_FOUND: 'Este tesouro já foi coletado.',
    VALIDATION_ERROR: 'Comando inválido enviado ao servidor.',
    OFFLINE: 'Servidor local offline. Rode `npx agent-rpg` de novo no terminal.',
    ASCENSION_LOCKED: 'Chegue ao Ato V nesta run para ascender.',
    INSUFFICIENT_RUNES: 'Runas insuficientes para este talento.',
    TALENT_MAX_LEVEL: 'Este talento já está no nível máximo.',
  },
  battleLog: (entry, monster) => {
    switch (entry.code) {
      case 'hero_joined':
        return `${entry.actor} entrou na party (${heroClasses[entry.detail as HeroClass] ?? entry.detail}).`
      case 'skill_buff':
        return `${entry.actor} ativou a skill ${entry.detail}!`
      case 'monster_slain':
        return `${entry.actor} derrotou ${monster(entry.target)} (+${entry.amount ?? 0}g).`
      case 'boss_spawned':
        return `CHEFE DO ATO ${entry.amount ?? 1}: ${monster(entry.actor)} surgiu na Cidadela!`
      case 'boss_slain':
        return `VITÓRIA! ${entry.actor} abateu ${monster(entry.target)} (+${entry.amount ?? 0}g)!`
      case 'hero_hit':
        return `${monster(entry.target)} contra-atacou ${entry.actor} (-${entry.amount ?? 0} HP).`
      case 'hero_knocked_out':
        return `${entry.actor} caiu em combate e recuou para a Taverna.`
      case 'upgrade_bought':
        return `Acampamento melhorado: ${upgrades[entry.actor as UpgradeId]?.name ?? entry.actor} (-${entry.amount ?? 0}g).`
      case 'loot_collected':
        return `Tesouro coletado no mapa (+${entry.amount ?? 0}g)!`
      case 'campaign_victory':
        return `ATO V CONCLUÍDO! ${entry.actor} derrotou o Dragão da Regressão. A Fenda Infinita se abriu!`
      case 'ascended':
        return `A party ascendeu do Ato ${entry.detail ?? '?'} e ganhou ${entry.amount ?? 0} runas!`
      case 'talent_bought':
        return `Talento aprendido: ${talents[entry.actor as TalentId]?.name ?? entry.actor} (Nv.${entry.amount ?? 1}).`
      case 'relic_found':
        return `RELÍQUIA! ${entry.actor} encontrou ${relics[entry.detail as RelicId]?.name ?? entry.detail}.`
      case 'relic_duplicate':
        return `${entry.actor} achou uma relíquia repetida e a derreteu em ${entry.amount ?? 0} runas.`
      case 'quest_completed':
        return `Quest concluída (${entry.detail === 'weekly' ? 'semanal' : 'diária'}): +${entry.amount ?? 0} runas e ouro!`
      case 'achievement_unlocked':
        return `Conquista: ${achievementNames[entry.actor] ?? entry.actor} (+${entry.amount ?? 0} runas)!`
    }
  },
  ui: {
    connecting: 'Conectando à Taverna local...',
    retry: 'Tentar novamente',
    partyLevel: 'NV. PARTY',
    gold: 'OURO',
    kills: 'ABATES',
    demoOn: 'Demo: ON',
    demoOff: 'Modo Demo',
    summonRaid: 'Invocar Horda',
    soundOn: 'Som: ON',
    soundOff: 'Som: OFF',
    reset: 'Reset',
    live: '● AO VIVO',
    offline: '○ OFFLINE',
    simulator: 'Simulador',
    boss: 'CHEFE',
    bossProgress: 'Progresso até o Chefe',
    languageToggleLabel: 'Switch to English',
    heroInspector: 'INSPETOR DE HERÓI',
    levelShort: 'Nv.',
    zone: 'Zona',
    skill: 'Skill',
    activeBuff: 'Buff ativo',
    tool: 'Ferramenta',
    file: 'Arquivo',
    killsDamage: 'Abates / Dano',
    noHeroYet: 'Nenhum agente ativo ainda. Clique em um herói no mapa para inspecionar sua atividade.',
    party: 'PARTY',
    tavernWaiting: 'Taverna aguardando agentes...',
    battleLogTitle: 'DIÁRIO DE BATALHA',
    battleLogEmpty: 'Os feitos dos agentes aparecerão aqui.',
    noSkill: 'Nenhuma',
    shopTitle: 'LOJA DO ACAMPAMENTO',
    shopHint: 'Clique em moedas e baús no mapa para coletar ouro',
    uses: 'Usos',
    max: 'MÁXIMO',
    bestiary: 'BESTIÁRIO',
    bestiaryEmpty: 'Nenhum monstro registrado ainda.',
    monsterFallback: 'Monstro',
    victoryTitle: 'ATO V CONCLUÍDO!',
    victoryBody:
      'O Dragão da Regressão caiu, e atrás dele se abriu a Fenda Infinita. Siga mais fundo, ou ascenda agora para trocar esta run por runas.',
    victoryPartyLevel: 'Nível da Party',
    victoryKills: 'Monstros Abatidos',
    victoryGold: 'Ouro Acumulado',
    victoryEvents: 'Eventos Reais',
    keepGoing: 'Seguir em frente',
    runes: 'RUNAS',
    ascensionBadge: (n) => `✦ Ascensão ${n}`,
    ascensionTitle: 'ASCENSÃO',
    ascensionHint: 'Ascender reinicia a run no Ato 1 em troca de runas. Talentos, relíquias e conquistas ficam para sempre.',
    ascendButton: (runes) => `Ascender: +${runes} runas`,
    ascendLocked: (act) => `Chegue ao Ato ${act} para ascender`,
    ascendConfirm: (runes) => `Ascender agora por ${runes} runas? Nível, ouro e upgrades do acampamento recomeçam.`,
    talentsTitle: 'TALENTOS',
    buyOne: 'Comprar',
    buyMax: 'Máx',
    trophiesTitle: 'TROFÉUS',
    relicsTitle: (owned, total) => `Relíquias ${owned}/${total}`,
    unknownRelic: 'Relíquia não descoberta',
    achievementsTitle: (unlocked, total) => `Conquistas ${unlocked}/${total}`,
    questsTitle: 'QUESTS',
    daily: 'Diárias',
    weekly: 'Semanais',
    questReward: (runes) => `+${runes} runas + ouro`,
    questDone: 'Feita!',
    resetConfirm: 'O reset total apaga a run E todas as runas, talentos, relíquias e conquistas. Continuar?',
    bossIncoming: '⚠ CHEFE À VISTA ⚠',
    bossDefeated: '★ CHEFE DERROTADO ★',
    relicFound: '✦ RELÍQUIA ENCONTRADA ✦',
    canvasEmpty: 'A Taverna está tranquila. Rode um agente no Claude Code ou Antigravity, ou ligue o Modo Demo para ver a party lutando!',
    canvasLabel: 'Mapa do Agent RPG. Clique nos heróis para inspecionar e nos tesouros para coletar ouro.',
    activityTitle: 'Atividade ao vivo',
    activityEmpty: 'Nada ainda. Cada ferramenta que seus agentes usam aparece aqui.',
    activityHit: (action, damage, monster) => `${action} → ${damage} de dano em ${monster}`,
    activityFailed: (action, monster) => `${action} falhou → ${monster} revidou`,
    help: 'Como jogar',
    tutorialStep: (current, total) => `${current} / ${total}`,
    tutorialBack: 'Voltar',
    tutorialNext: 'Próximo',
    tutorialDone: 'Entendi!',
    tutorialSkip: 'Pular',
  },
}
