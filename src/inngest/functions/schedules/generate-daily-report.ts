import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { scheduleNextRun } from "@/utils/scheduler";

export const generateReportSchedule = inngest.createFunction(
    {
        id: "generate-report",
        cancelOn: [{
            event: "workflow/schedule/stop", // The event name that cancels this function
            if: "async.data.workflowId == event.data.workflowId && async.data.user_id == event.data.user_id",
        }],
    },
    { event: "workflow/report.requested" },
    async ({ step, event, logger, sheets, runId }) => {
        const { workflowId, user_id, cronExpression, scheduledRun, tz, input } = event.data;
        
        if (scheduledRun) {
            logger.info({ workflowId, user_id }, "Scheduled run detected.");
            await scheduleNextRun(step, event, "workflow/report.requested", { id: runId, cronExpression, tz })
        }

        logger.info(`Generating report for user ${user_id}`);


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
