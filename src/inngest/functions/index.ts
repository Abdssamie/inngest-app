// Export all workflow functions
export { generateReportSchedule } from "./schedules/generate-daily-report";
export { emailNotificationWorkflow } from "./email-notification";
export { dataSyncAdvancedWorkflow } from "./data-sync-advanced";
export { slackIntegrationProWorkflow } from "./slack-integration-pro";
export { basicSchedulerWorkflow } from "./basic-scheduler";

// Array of all workflow functions for easy registration
import { generateReportSchedule } from "./schedules/generate-daily-report";
import { emailNotificationWorkflow } from "./email-notification";
import { dataSyncAdvancedWorkflow } from "./data-sync-advanced";
import { slackIntegrationProWorkflow } from "./slack-integration-pro";
import { basicSchedulerWorkflow } from "./basic-scheduler";

export const workflowFunctions = [
    generateReportSchedule,
    emailNotificationWorkflow,
    dataSyncAdvancedWorkflow,
    slackIntegrationProWorkflow,
    basicSchedulerWorkflow,
];
