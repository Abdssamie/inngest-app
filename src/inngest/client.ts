import {Inngest, dependencyInjectionMiddleware, Context} from "inngest";
import prisma from "@prisma/client"


// Extend the Inngest context to include your custom data
export interface CustomInngestContext extends Context {
  credentials?: Record<string, object>;
}


// Create a client to send and receive events
export const inngest = new Inngest({
    id: "my-app",
    middleware: [
        dependencyInjectionMiddleware({prisma})
    ]
});
