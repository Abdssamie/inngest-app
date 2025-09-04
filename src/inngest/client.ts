import { EventSchemas, Inngest, dependencyInjectionMiddleware } from "inngest";
import { credentialMiddleware } from "@/inngest/middleware/credential";
import { gmailMiddleware } from "./middleware/gmail";
import prisma from "@/lib/prisma"
import { MinimalEventPayload } from "inngest/types";
import { User } from "@prisma/client";
import logger from "@/services/logging";

// Base required fields for data
type BaseUserEventData = {
    user_id: InternalUserId;
};

// Allow extending with optional fields via a generic
type UserEventPayload<T extends object = {}> = {
    user: User; // From Prisma
    data: BaseUserEventData & T; // Merge required + optional
};

export type ScheduleEventPayload<T extends object = {
    scheduleId: string;
    user_id: string;
}> = {
    user: User; // From Prisma
    data: BaseUserEventData & T; // Merge required + optional
}

export type Events = {
    // Internal events
    "internal/user/new.signup": UserEventPayload<{ plan?: string; referralCode?: string; }>;
    "internal/user/new.google.signup": UserEventPayload<{ plan?: string; referralCode?: string; }>;

    // App events
    "app/schedule/run": ScheduleEventPayload;
    
    "app/schedule/report.requested": ScheduleEventPayload;
    "app/report.requested": UserEventPayload<{ user_id: string;}>;

    // Scratchpad events
    "blog-post.updated": MinimalEventPayload<{}>;
    "invoice/data.submitted": MinimalEventPayload<{ data: any; }>;
};

export type EventFor<K extends keyof Events> = { name: K } & Events[K];

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "my-app",
    middleware: [
        dependencyInjectionMiddleware({ prisma }),
        credentialMiddleware,
        gmailMiddleware
    ],
    logger: logger,
    schemas: new EventSchemas().fromRecord<Events>()
}); 
