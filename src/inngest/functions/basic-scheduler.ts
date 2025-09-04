import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { scheduleNextRun } from "@/utils/scheduler";

export const basicSchedulerWorkflow = inngest.createFunction(
    {
        id: "basic-scheduler",
        cancelOn: [{
            event: "workflow/schedule/stop",
            if: "async.data.workflowId == event.data.workflowId && async.data.user_id == event.data.user_id",
        }],
    },
    { event: "workflow/scheduler.basic" },
    async ({ step, event, logger, runId }) => {
        const { workflowId, user_id, cronExpression, scheduledRun, tz, input, metadata } = event.data;
        
        if (scheduledRun) {
            logger.info({ workflowId, user_id }, "Scheduled run detected.");
            await scheduleNextRun(step, event, "workflow/scheduler.basic", { id: runId, cronExpression, tz });
        }

        logger.info(`Processing basic scheduler task for user ${user_id}`);

        if (!input) {
            throw new NonRetriableError("Basic scheduler input is required");
        }

        const { taskName, description } = input;

        // TODO: Implement basic scheduler logic
        // - Log task execution start
        // - Execute the scheduled task based on taskName
        // - Handle task-specific logic (could be configurable)
        // - Track execution time and success/failure
        // - Send notifications if configured
        // - Update task status in database
        // - Log completion with statistics

        logger.info(`Would execute scheduled task: "${taskName}"`);
        if (description) {
            logger.info(`Task description: ${description}`);
        }
    }
);
