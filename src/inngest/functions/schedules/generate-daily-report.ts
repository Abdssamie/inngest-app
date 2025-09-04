import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { SheetsService } from "@/lib/integrations/google/sheets";
import { GoogleCredentialPayload } from "@/types/credentials/credential-types";
import { CredentialType } from "@prisma/client";
import { NonRetriableError } from "inngest";
import CronExpressionParser from "cron-parser";

/**
 * STEP 2: Handle recurring execution.
 * Runs the task, then calculates next run and re-schedules itself.
 */
export const runScheduledJob = inngest.createFunction(
    { id: "run-scheduled-job" },
    { event: "app/schedule/report.requested" },
    async ({ step, event, logger }) => {
        const { scheduleId } = event.data;

        const schedule = await step.run("fetch-schedule", () =>
            prisma.schedule.findUnique({ where: { id: scheduleId, userId: event.user.id } })
        );

        if (!schedule || !schedule.isActive) {
            logger.info({ scheduleId }, "Schedule is inactive or missing. Exiting.");
            return;
        }

        // Fire the report generation event
        await step.sendEvent("trigger-report-generation", {
            name: "app/report.requested",
            user: event.user,
            data: {
                user_id: event.user.id as InternalUserId,
            },
        });

        // Calculate next run
        const nextRun = await step.run("calculate-next-run", () => {
            const interval = CronExpressionParser.parse(schedule.cronExpression, {
                tz: schedule.timezone || "UTC",
            });
            return interval.next().toDate();
        });

        logger.info({ scheduleId, nextRun }, "Next run scheduled.");

        // Schedule next run
        await step.sendEvent("schedule-next-run", {
            name: "app/schedule/report.requested",
            user: event.user,
            data: (schedule.payload as any) || {}
        });
    }
);


/**
 * STEP 2: Generate the actual report from Google Sheets.
 */
export const generateReport = inngest.createFunction(
    { id: "generate-report" },
    { event: "app/schedule/report.requested" },
    async ({ event, logger, credentials, step }) => {
        const { user_id } = event.data;
        logger.info(`Generating report for user ${user_id}`);

        // Get Google credentials
        const googleCredential = credentials.find(
            (cred) => cred.type === CredentialType.GOOGLE
        );

        if (!googleCredential) {
            throw new NonRetriableError("No Google credential found");
        }

        const sheets = new SheetsService(
            user_id,
            googleCredential.id,
            googleCredential.data as GoogleCredentialPayload
        );

        // Fetch sheet details
        const reportSheetId = await step.run("fetch-sheet", async () => {
            return await sheets.findSheetByName("Report-data");
        });

        if (!reportSheetId) {
            throw new NonRetriableError("No report data sheet found");
        }

        const sheetData = await step.run("fetch-sheet-data", async () => {
            return await sheets.getSheetData(reportSheetId, "Sheet1");
        });

        logger.info(`Fetched ${sheetData.length} rows from sheet ${reportSheetId}`);
        // TODO: Process and send report (email, Slack, etc.)
    }
);
