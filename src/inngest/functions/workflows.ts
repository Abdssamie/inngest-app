import prisma from "@/lib/prisma"
import { CredentialType, Provider, Workflow , Prisma} from "@prisma/client";

enum GOOGLE_SCOPES {
    SHEETS = "https://www.googleapis.com/auth/spreadsheets",
    DRIVE = "https://www.googleapis.com/auth/drive",
    GMAIL = "https://www.googleapis.com/auth/gmail.send",
}


export function createDefaultWorkflows(userId: InternalUserId) {

    const defaultworkflows :Workflow[] = [
        {
            name: "Generate a daily report",
            description: "Generate a daily report for a user",
            canBeScheduled: true,
            enabled: false,
            requiredProviders: [Provider.GOOGLE],
            cronExpressions: [],
            config: {
                requiredScopes: [GOOGLE_SCOPES.SHEETS, GOOGLE_SCOPES.DRIVE, GOOGLE_SCOPES.GMAIL]
            } as Prisma.JsonValue,
            eventName: "workflow/report.request",
            id: "",
            createdAt: undefined,
            updatedAt: undefined,
            timezone: "",
            lastRunAt: undefined,
            nextRunAt: undefined,
            input: "",
            userId: ""
        }
    ]
    try {
        prisma.workflow.createMany({
            data: defaultworkflows.map((workflow) => {
                return {
                    userId: userId,
                    name: workflow.name,
                    description: workflow.description,
                    canBeScheduled: workflow.canBeScheduled,
                    requiredProviders: workflow.requiredProviders,
                    enabled: workflow.enabled,
                    eventName: workflow.eventName,
                    config: workflow.config,
                    cronExpressions: workflow.cronExpressions,
                };
            }),
        });
    } catch (error) {
        throw new Error('Error creating default workflows:', error);
    }
}
