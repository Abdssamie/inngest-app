import {NextResponse} from "next/server";
import {inngest} from "@/inngest/client";
import {auth} from '@clerk/nextjs/server'; // Assuming Clerk integration


// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

export async function GET() {
    const user = await auth(); // Get the authenticated userId from Clerk

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    // Send your event payload to Inngest
    await inngest.send({
        name: "test/hello.world",
        user: user,
        data: {
            email: "testUser@example.com",
        },
    });

    return NextResponse.json({message: "Event sent!"});
}