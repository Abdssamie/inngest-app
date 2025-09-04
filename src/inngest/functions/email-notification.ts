import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { scheduleNextRun } from "@/utils/scheduler";

export const emailNotificationWorkflow = inngest.createFunction(
    {
        id: "email-notification",
        cancelOn: [{
            event: "workflow/schedule/stop",
            if: "async.data.workflowId == event.data.workflowId && async.data.user_id == event.data.user_id",
        }],
    },
    { event: "workflow/email.notification" },
    async ({ step, event, logger, gmail, runId }) => {
        const { workflowId, user_id, cronExpression, scheduledRun, tz, input, metadata } = event.data;
        
        if (scheduledRun) {
            logger.info({ workflowId, user_id }, "Scheduled run detected.");
            await scheduleNextRun(step, event, "workflow/email.notification", { id: runId, cronExpression, tz });
        }

        logger.info(`Processing email notification for user ${user_id}`);

        if (!input) {
            throw new NonRetriableError("Email notification input is required");
        }

        const { recipientEmails, subject, template, priority } = input;

        // TODO: Implement email notification logic
        // - Validate recipient emails
        // - Apply the selected template (simple/detailed/custom)
        // - Set priority level for email sending
        // - Send email via Gmail API
        // - Log success/failure

        logger.info(`Would send email to ${recipientEmails.length} recipients with subject: "${subject}"`);
        logger.info(`Template: ${template}, Priority: ${priority}`);
    }
);
