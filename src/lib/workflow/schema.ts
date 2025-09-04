import { z } from "zod";

export const InputTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "json",
  "credential",
]);

export const WorkflowInputSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: InputTypeSchema,
});

export const WorkflowInputArraySchema = z.array(WorkflowInputSchema);

export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type WorkflowInputArray = z.infer<typeof WorkflowInputArraySchema>;
