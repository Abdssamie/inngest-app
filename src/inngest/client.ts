import {EventSchemas, Inngest, dependencyInjectionMiddleware} from "inngest";
import prisma from "@prisma/client"
import { credentialMiddleware } from "@/inngest/middleware/credential";
import { gmailMiddleware } from "./middleware/gmail";
import { User } from "@prisma/client";
import { MinimalEventPayload } from "inngest/types";

// Base required fields for data
type BaseUserEventData = {
    user_id: string;
};


// Allow extending with optional fields via a generic
type UserEventPayload<T extends object = {}> = {
    user: User; // From Prisma
    data: BaseUserEventData & T; // Merge required + optional
};

type TestHelloWorldEvent = MinimalEventPayload<{ message: string }>;

type Events = {
    "user/new.signup": UserEventPayload<{ plan?: string; referralCode?: string }>;
    "user/new.google.signup": UserEventPayload<{ plan?: string; referralCode?: string }>;
    "blog-post.updated": MinimalEventPayload;
    "hello.world": TestHelloWorldEvent;
};

export type EventFor<K extends keyof Events> = { name: K } & Events[K];


// Create a client to send and receive events
export const inngest = new Inngest({
    id: "my-app",
    middleware: [
        dependencyInjectionMiddleware({prisma}),
        credentialMiddleware,
        gmailMiddleware
    ],
    schemas : new EventSchemas().fromRecord<Events>()
});
