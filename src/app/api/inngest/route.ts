import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateReportSchedule } from "@/inngest/functions/schedules/generate-daily-report";

/**
 * @swagger
 * /api/inngest:
 *   get:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 *   post:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 *   put:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateReportSchedule,
  ],
});
