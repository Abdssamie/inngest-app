import { Events, inngest, isEventKey, SchedulableEventPayload, ScheduleStopPayload } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getInternalUser } from "@/lib/helpers/getInternalUser";
import { WorkflowInput } from "@/lib/workflow/schema";


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
        const workflow = await prisma.workflow.update({
            where: {
                id: params.id,
                userId: internalUser.id,
            },
            data: {
                enabled: true,
            }
        });

        if (!workflow) {
            return new Response("Workflow not found", { status: 404 });
        }

        if (!workflow.canBeScheduled) {
            return new Response("This workflow cannot be scheduled", { status: 500 })
        } else if (workflow.cronExpressions.length === 0) {
            return new Response("No cron expressions found", { status: 500 })
        } else if (workflow.cronExpressions.length > 1) {
            return new Response("Multiple cron expressions are not supported yet", { status: 500 })
        }

        if (!isEventKey(workflow.eventName)) {
            return new Response("Internal server error", { status: 500 })

        }

        const cronExpression = workflow.cronExpressions[0];

        // Send an event to Inngest to trigger the workflow
        await inngest.send({
            name: workflow.eventName as any, // This is safe because we checked it above
            user: internalUser,
            data: {
                user_id: internalUser.id as InternalUserId,
                input: workflow.input as WorkflowInput,
                scheduledRun: true,
                workflowId: workflow.id,
                cronExpression: cronExpression,
                tz: workflow.timezone
            },
        } satisfies SchedulableEventPayload & { name: keyof Events });

        return NextResponse.json(
            { message: "Workflow scheduled successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error running workflow:", error);
        return new Response("Error running workflow", { status: 500 });
    }
}


export async function DELETE(
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
            }
        });

        if (!workflow) {
            return new Response("Workflow not found", { status: 404 });
        }

        if (!workflow.enabled) {
            return new Response("Workflow is not enabled", { status: 500 })
        }

        // Send an event to Inngest to stop the workflow
        await inngest.send({
            name: "workflow/schedule/stop", 
            data: {
                user_id: internalUser.id as InternalUserId,
                workflowId: workflow.id,
            },
        } satisfies ScheduleStopPayload & { name: keyof Events });

        await prisma.workflow.update({
            where: {
                id: params.id,
                userId: internalUser.id,
            },
            data: {
                enabled: false,
            }
        });

        return NextResponse.json(
            { message: "Workflow stopped" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error stopping workflow:", error);
        return new Response("Error stopping workflow", { status: 500 });
    }
}
