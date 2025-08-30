import {NextResponse} from "next/server";
import {EventFor, inngest} from "@/inngest/client";
import {auth} from '@clerk/nextjs/server'; // Assuming Clerk integration
import { getInternalUser } from "@/lib/helpers/getInternalUser";
import {GetEvents} from "inngest";


// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Send a test event to Inngest
 *     description: Sends a test event to Inngest for the authenticated user.
 *     responses:
 *       200:
 *         description: Event sent successfully.
 *       401:
 *         description: Unauthorized.
 */
export async function GET() {
    const user = await auth(); // Get the authenticated userId from Clerk

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }
    const internalUser = await getInternalUser(user.userId as ClerkUserId); // Get the internal user object from the database
    
    // Send your event payload to Inngest
    await inngest.send({
        name: "hello.world",
        data: {
            message: "testUser@example.com",
        }
    } satisfies  EventFor<"hello.world"> );

    return NextResponse.json({message: "Event sent!"});
}