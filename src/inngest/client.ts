import { EventSchemas, Inngest, dependencyInjectionMiddleware } from "inngest";
import { credentialMiddleware } from "@/inngest/middleware/credential";
import { gmailMiddleware } from "./middleware/gmail";
import prisma from "@/lib/prisma"
import { MinimalEventPayload } from "inngest/types";
import { User } from "@prisma/client";
import logger from "@/services/logging";
import { sheetsMiddleware } from "./middleware/sheets";
import { WorkflowInput } from "@/lib/workflow/schema";


// Allow extending with optional fields via a generic
type UserEventPayload<T extends object = {}> = {
    user: User; // From Prisma
    data: { user_id: InternalUserId } & T; // Merge required + optional
};

export type SchedulableEventPayload<T extends object = { user_id: InternalUserId }> = {
    user: User; // From Prisma
    data: {
        input: WorkflowInput | null,
        scheduledRun: boolean,
        workflowId: string,
        cronExpression: string | null,
        tz: string | null
    } & T;
}

export type ScheduleStopPayload<T extends object = { user_id: InternalUserId }> = {
    data: {
        workflowId: string,
    } & T,
}

export type Events = {
    // Internal events
    "internal/user/new.signup": UserEventPayload<{ plan?: string; referralCode?: string; }>;
    "internal/user/new.google.signup": UserEventPayload<{ plan?: string; referralCode?: string; }>;

    // Workflow events
    "workflow/schedule/stop": ScheduleStopPayload;
    "workflow/report.requested": SchedulableEventPayload;

    // Scratchpad events
    "blog-post.updated": MinimalEventPayload<{}>;
    "invoice/data.submitted": MinimalEventPayload<{ data: any; }>;
};

// Array of the event keys for runtime check
const eventKeys = [
    "internal/user/new.signup",
    "internal/user/new.google.signup",
    "workflow/schedule/stop",
    "workflow/schedule/report.requested",
    "app/report.requested",
    "blog-post.updated",
    "invoice/data.submitted",
] as const;

// Create a union type of all the keys from the Events type
type EventKeys = keyof Events;

export type EventFor<K extends keyof Events> = { name: K } & Events[K];

// Type guard function to check if the input string is a valid event key
export function isEventKey(str: string): str is EventKeys {
    return (eventKeys as readonly string[]).includes(str);
}

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "my-app",
    middleware: [
        dependencyInjectionMiddleware({ prisma }),
        credentialMiddleware,
        gmailMiddleware,
        sheetsMiddleware
    ],
    logger: logger,
    schemas: new EventSchemas().fromRecord<Events>()
}); 
