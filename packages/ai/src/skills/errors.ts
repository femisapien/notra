/**
 * Domain errors of the skill write paths. Plain `Error` subclasses on purpose:
 * `packages/ai` is consumed by the dashboard (oRPC), the agent tools (eve) and
 * the public API (Effect). Each boundary maps these onto its own error model —
 * `apps/api/src/errors/skills.ts` keeps the tagged Effect errors.
 */
export class SkillServiceError extends Error {
  readonly skillName: string;

  constructor(errorName: string, skillName: string, message: string) {
    super(message);
    this.name = errorName;
    this.skillName = skillName;
  }
}

export class SkillNotFoundError extends SkillServiceError {
  constructor(skillName: string) {
    super(
      "SkillNotFoundError",
      skillName,
      `Skill "${skillName}" does not exist in this organization`
    );
  }
}

export class SkillDuplicateError extends SkillServiceError {
  constructor(skillName: string) {
    super(
      "SkillDuplicateError",
      skillName,
      `A skill named "${skillName}" already exists`
    );
  }
}

/** Upgrades only apply to system skills; a custom skill has no upstream. */
export class SkillNotSystemError extends SkillServiceError {
  constructor(skillName: string) {
    super(
      "SkillNotSystemError",
      skillName,
      `Skill "${skillName}" is not a system skill`
    );
  }
}

/** The registry has no published version of this name yet. */
export class SystemSkillVersionMissingError extends SkillServiceError {
  constructor(skillName: string) {
    super(
      "SystemSkillVersionMissingError",
      skillName,
      `No published version exists for skill "${skillName}"`
    );
  }
}

/** The upgrade payload does not satisfy the chosen strategy. */
export class SkillUpgradeInputError extends SkillServiceError {
  constructor(skillName: string, message: string) {
    super("SkillUpgradeInputError", skillName, message);
  }
}
