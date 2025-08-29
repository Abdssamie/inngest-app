import { z } from 'zod';

// This is the Zod schema for a single water quality parameter.
export const ParameterSchema = z.object({
  name: z.string().describe("The name of the water quality parameter (e.g., 'pH', 'Chloramine')."),
  value: z.number().describe("The measured value for the parameter."),
  unit: z.string().describe("The unit of measurement for the parameter."),
  min_accepted_val: z.number().nullable().default(null).describe("The minimum accepted value for the parameter."),
  max_accepted_val: z.number().nullable().default(null).describe("The maximum accepted value for the parameter."),
  comment: z.string().default("").describe("Optional comments on the parameter's status."),
  status: z.enum(["OK", "OUT_OF_RANGE", "NOT_PHYSICALLY_POSSIBLE"]).default("OK").describe("The validation status of the parameter."),
  issues: z.record(z.string(), z.string()).default({}).describe("A dictionary of issues with corresponding messages."),
});

// This is the Zod schema for the main AquaLimeLabs validation report.
export const ReportSchema = z.object({
  report_date: z.date().describe("The date the report was generated."),
  parameters: z.array(ParameterSchema).describe("A list of Parameter objects detailing each water quality measurement."),
});