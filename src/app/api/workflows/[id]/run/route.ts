import { isEventKey, Events, inngest, SchedulableEventPayload } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getInternalUser } from "@/lib/helpers/getInternalUser";


/**
 * @swagger
 * /api/workflows/{id}/run:
 *   post:
 *     summary: Run a workflow
 *     description: Runs a workflow by its ID for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow run successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Workflow not found.
 *       500:
 *         description: Error running workflow.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await auth();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const internalUser = await getInternalUser(user.userId as ClerkUserId);

  if (!internalUser) {
    return new Response("User not found", { status: 404 });
  }

  try {
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: params.id,
        userId: internalUser.id,
      },
    });

    if (!workflow) {
      return new Response("Workflow not found", { status: 404 });
    }

    if (!isEventKey(workflow.eventName)) {
      return new Response("Internal server error", { status: 500 })
    }

    // Send an event to Inngest to trigger the workflow
    await inngest.send({
      name: workflow.eventName as any,  // This is safe because we checked it above
      user: internalUser,
      data: {
        user_id: internalUser.id as InternalUserId,
        input: null,
        scheduledRun: false,
        workflowId: workflow.id,
        cronExpression: null,
        tz: workflow.timezone,
      },
    } satisfies SchedulableEventPayload & { name: keyof Events });

    return NextResponse.json(
      { message: "Workflow run successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error running workflow:", error);
    return new Response("Error running workflow", { status: 500 });
  }
}
