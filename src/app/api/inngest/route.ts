import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {generateDailyReportDispatcher, generateDailyReport} from "@/inngest/functions/schedules/generate-daily-report";

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
    generateDailyReportDispatcher, // <-- This is where you'll always add all your functions
      generateDailyReport
  ],
});
