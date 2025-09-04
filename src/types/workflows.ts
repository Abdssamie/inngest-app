import { z } from "zod";

// Base workflow input type - can be any object structure depending on the workflow
export type WorkflowInput = Record<string, any>;

// Context provided to workflow execution functions
export interface WorkflowExecutionContext {
  workflowId: string;
  userId: string;
  scheduledRun: boolean;
  cronExpression?: string;
  timezone?: string;
  metadata?: Record<string, any>;
}

// Result returned from workflow execution
export interface WorkflowResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  executionTime?: number;
  nextRunAt?: Date;
}

// Workflow input field definition for dynamic forms
export interface WorkflowInputField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'json' | 'credential' | 'email' | 'url' | 'date' | 'time' | 'file' | 'select' | 'multiselect';
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

// Schema for validating workflow input fields
export const WorkflowInputFieldSchema = z.object({
  key: z.string().min(1, "Field key is required"),
  label: z.string().min(1, "Field label is required"),
  description: z.string().optional(),
  type: z.enum(['text', 'number', 'boolean', 'json', 'credential', 'email', 'url', 'date', 'time', 'file', 'select', 'multiselect']),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
});

// Base schema for workflow execution requests
export const WorkflowExecutionRequestSchema = z.object({
  input: z.record(z.string(), z.any()).optional(),
  scheduledRun: z.boolean().default(false),
  cronExpression: z.string().optional(),
  timezone: z.string().default("UTC"),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WorkflowExecutionRequest = z.infer<typeof WorkflowExecutionRequestSchema>;
