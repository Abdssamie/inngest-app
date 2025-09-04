import { z } from "zod";

// Simple query schema for workflow listing
export const WorkflowListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  enabled: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "lastRunAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type WorkflowListQuery = z.infer<typeof WorkflowListQuerySchema>;
