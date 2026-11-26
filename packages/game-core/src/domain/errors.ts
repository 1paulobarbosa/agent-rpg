export class DomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = new.target.name
    this.code = code
  }
}

export class InsufficientGoldError extends DomainError {
  constructor(required: number, available: number) {
    super('INSUFFICIENT_GOLD', `Requires ${required} gold, only ${available} available`)
  }
}

export class UpgradeMaxLevelError extends DomainError {
  constructor(upgradeId: string) {
    super('UPGRADE_MAX_LEVEL', `Upgrade ${upgradeId} already reached max level`)
  }
}

export class UnknownUpgradeError extends DomainError {
  constructor(upgradeId: string) {
    super('UNKNOWN_UPGRADE', `Unknown upgrade ${upgradeId}`)
  }
}

export class LootNotFoundError extends DomainError {
  constructor(lootId: string) {
    super('LOOT_NOT_FOUND', `Loot drop ${lootId} not found`)
  }
}

export class AscensionLockedError extends DomainError {
  constructor(requiredAct: number) {
    super('ASCENSION_LOCKED', `Reach Act ${requiredAct} in this run before ascending`)
  }
}

export class InsufficientRunesError extends DomainError {
  constructor(required: number, available: number) {
    super('INSUFFICIENT_RUNES', `Requires ${required} runes, only ${available} available`)
  }
}

export class TalentMaxLevelError extends DomainError {
  constructor(talentId: string) {
    super('TALENT_MAX_LEVEL', `Talent ${talentId} already reached max level`)
  }
}
