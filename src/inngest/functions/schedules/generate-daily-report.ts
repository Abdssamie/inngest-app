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
        const { workflowId, user_id, cronExpression, scheduledRun, tz, input, metadata } = event.data;
        
        if (scheduledRun) {
            logger.info({ workflowId, user_id }, "Scheduled run detected.");
            await scheduleNextRun(step, event, "workflow/report.requested", { id: runId, cronExpression, tz })
        }

        logger.info(`Generating daily report for user ${user_id}`);

        if (!input) {
            throw new NonRetriableError("Daily report input is required");
        }

        const { reportTitle, sheetName, emailRecipients, reportFormat, includeCharts } = input;

        // TODO: Implement daily report generation logic
        // - Fetch sheet data from specified sheetName
        // - Generate report in specified format (PDF, CSV, XLSX)
        // - Include charts if includeCharts is true
        // - Format report with reportTitle
        // - Send report to emailRecipients
        // - Log success/failure with recipient count

        logger.info(`Would generate "${reportTitle}" report from sheet "${sheetName}"`);
        logger.info(`Format: ${reportFormat}, Include charts: ${includeCharts}`);
        logger.info(`Would send to ${emailRecipients.length} recipients: ${emailRecipients.join(', ')}`);

        // Legacy implementation for reference:
        // const reportSheetId = await step.run("fetch-sheet", async () => {
        //     return await sheets.findSheetByName(sheetName);
        // });
        // 
        // if (!reportSheetId) {
        //     throw new NonRetriableError(`Sheet "${sheetName}" not found`);
        // }
        // 
        // const sheetData = await step.run("fetch-sheet-data", async () => {
        //     return await sheets.getSheetData(reportSheetId, "Sheet1");
        // });
        // 
        // logger.info(`Fetched ${sheetData.length} rows from sheet ${reportSheetId}`);
    }
);
