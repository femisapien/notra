import { SkillServiceError } from "@notra/ai/skills/errors";
import { updateSkillContent } from "@notra/ai/skills/functions/upstream";
import { defineTool } from "eve/tools";

import { updateSkillInputSchema } from "../schemas/skill-tools";
import { requireOrganizationId } from "../utils/organization";

export function createUpdateSkillTool() {
  return defineTool({
    description:
      "Update a skill's content and/or description for the organization. Requires at least one field to change. Does not rename skills.",
    inputSchema: updateSkillInputSchema,
    async execute({ name, content, description }, ctx) {
      const organizationId = requireOrganizationId(ctx);

      try {
        const updated = await updateSkillContent(
          { organizationId },
          { name },
          { content, description }
        );

        return {
          name: updated.name,
          updatedFields: [
            ...(content === undefined ? [] : ["content"]),
            ...(description === undefined ? [] : ["description"]),
          ],
        };
      } catch (error) {
        if (error instanceof SkillServiceError) {
          throw new Error(`Skill "${name}" was not updated: ${error.message}`);
        }
        throw error;
      }
    },
  });
}
