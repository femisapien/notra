import {
  SkillDuplicateError as ServiceSkillDuplicateError,
  SkillNotFoundError as ServiceSkillNotFoundError,
  SkillNotSystemError as ServiceSkillNotSystemError,
  SkillUpgradeInputError as ServiceSkillUpgradeInputError,
  SystemSkillVersionMissingError as ServiceSystemSkillVersionMissingError,
} from "@notra/ai/skills/errors";

import {
  SkillDatabaseError,
  SkillDuplicateError,
  SkillNotFoundError,
  SkillNotSystemError,
  SkillUpgradeInputError,
  SystemSkillVersionNotFoundError,
} from "../errors/skills";
import type { SkillDomainError } from "../types/skills";

/**
 * Boundary between the shared skill service in `@notra/ai` (plain `Error`
 * subclasses) and the API's tagged Effect errors. Anything unrecognized stays a
 * `SkillDatabaseError` so Hono's central handler turns it into a 500.
 */
export function mapSkillServiceError(
  cause: unknown
): SkillDomainError | SkillDatabaseError {
  if (cause instanceof ServiceSkillNotFoundError) {
    return new SkillNotFoundError();
  }
  if (cause instanceof ServiceSkillDuplicateError) {
    return new SkillDuplicateError({ name: cause.skillName });
  }
  if (cause instanceof ServiceSkillNotSystemError) {
    return new SkillNotSystemError({ name: cause.skillName });
  }
  if (cause instanceof ServiceSystemSkillVersionMissingError) {
    return new SystemSkillVersionNotFoundError();
  }
  if (cause instanceof ServiceSkillUpgradeInputError) {
    return new SkillUpgradeInputError({ reason: cause.message });
  }

  return new SkillDatabaseError({ cause });
}
