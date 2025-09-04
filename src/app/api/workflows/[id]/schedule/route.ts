import {Events, inngest, isEventKey, SchedulableEventPayload, ScheduleStopPayload} from "@/inngest/client";
import {auth} from "@clerk/nextjs/server";
import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {getInternalUser} from "@/lib/helpers/getInternalUser";
import {WorkflowInput} from "@/types/workflows";
import {z} from "zod";
import {validateWorkflowInput} from "@/lib/workflow-templates";

// Schema for validating workflow execution requests
const WorkflowExecutionRequestSchema = z.object({
    input: z.record(z.string(), z.any()).optional(),
    scheduledRun: z.boolean().default(false),
    cronExpression: z.string().optional(),
    timezone: z.string().default("UTC"),
    metadata: z.record(z.string(), z.any()).optional(),
});


/**
 * @swagger
 * /api/workflows/{id}/schedule:
 *   post:
 *     summary: Schedule a workflow
 *     description: Enables and schedules a workflow by its ID for the authenticated user. Validates workflow input against the template schema.
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID to schedule
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: object
 *                 description: Workflow-specific input parameters that will be validated against the template schema
 *               cronExpression:
 *                 type: string
 *                 description: Optional cron expression to override the workflow's default schedule
 *               timezone:
 *                 type: string
 *                 default: "UTC"
 *                 description: Timezone for the schedule
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the workflow execution
 *     responses:
 *       200:
 *         description: Workflow scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Workflow scheduled successfully"
 *       400:
 *         description: Input validation failed or workflow cannot be scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workflow or user not found
 *       500:
 *         description: Error scheduling workflow
 */
export async function POST(
    req: NextRequest,
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            {message: "Unauthorized"},
            {status: 401}
        );
    }

    const internalUser = await getInternalUser(user.userId as ClerkUserId);

    if (!internalUser) {
        return NextResponse.json(
            {message: "User not found"},
            {status: 404}
        );
    }

    try {
        // Parse and validate request body
        let requestBody = {};
        try {
            const body = await req.text();
            if (body) {
                requestBody = JSON.parse(body);
            }
        } catch (parseError) {
            return NextResponse.json(
                {message: "Invalid JSON in request body"},
                {status: 400}
            );
        }

        // Validate request body structure
        const validationResult = WorkflowExecutionRequestSchema.safeParse(requestBody);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: "Invalid request body",
                    errors: validationResult.error.issues.map(e => e.message)
                },
                {status: 400}
            );
        }

        const {input, cronExpression, timezone, metadata} = validationResult.data;

        const workflow = await prisma.workflow.findUnique({
            where: {
                id: params.id,
                userId: internalUser.id,
            }
        });

        if (!workflow) {
            return NextResponse.json(
                {message: "Workflow not found"},
                {status: 404}
            );
        }

        // Get workflow template to validate input
        let templateId: string | undefined;
        templateId = workflow.templateId;

        validateWorkflowInput(templateId, input);

        // Update workflow with validated input and enable it
        const updatedWorkflow = await prisma.workflow.update({
            where: {
                id: params.id,
                userId: internalUser.id,
            },
            data: {
                enabled: true,
                input: input ? (input as any) : workflow.input,
                cronExpressions: cronExpression ? [cronExpression] : workflow.cronExpressions,
                timezone: timezone || workflow.timezone,
            }
        });

        if (!updatedWorkflow.canBeScheduled) {
            return NextResponse.json(
                {message: "This workflow cannot be scheduled"},
                {status: 400}
            );
        }

        if (updatedWorkflow.cronExpressions.length === 0) {
            return NextResponse.json(
                {message: "No cron expressions found. Please provide a cronExpression or ensure the workflow has a default schedule."},
                {status: 400}
            );
        }

        if (updatedWorkflow.cronExpressions.length > 1) {
            return NextResponse.json(
                {message: "Multiple cron expressions are not supported yet"},
                {status: 400}
            );
        }

        if (!isEventKey(updatedWorkflow.eventName)) {
            return NextResponse.json(
                {message: "Invalid workflow event name"},
                {status: 500}
            );
        }

        const finalCronExpression = updatedWorkflow.cronExpressions[0];

        // Send an event to Inngest to trigger the workflow
        await inngest.send({
            name: updatedWorkflow.eventName as any, // This is safe because we checked it above
            user: internalUser,
            data: {
                user_id: internalUser.id as InternalUserId,
                input: updatedWorkflow.input as WorkflowInput,
                scheduledRun: true,
                workflowId: updatedWorkflow.id,
                cronExpression: finalCronExpression,
                tz: updatedWorkflow.timezone,
                metadata: metadata
            },
        } satisfies SchedulableEventPayload & { name: keyof Events });

        await prisma.workflow.update({
            where: {
                id: params.id,
                userId: internalUser.id,
            },
            data: {
                enabled: true,
            }
        });

        return NextResponse.json(
            {message: "Workflow scheduled successfully"},
            {status: 200}
        );
    } catch (error) {
        console.error("Error scheduling workflow:", error);
        return NextResponse.json(
            {message: "Error scheduling workflow"},
            {status: 500}
        );
    }
}


/**
 * @swagger
 * /api/workflows/{id}/schedule:
 *   delete:
 *     summary: Stop a scheduled workflow
 *     description: Disables and stops a scheduled workflow by its ID for the authenticated user.
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID to stop
 *     responses:
 *       200:
 *         description: Workflow stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Workflow stopped"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workflow or user not found
 *       500:
 *         description: Error stopping workflow or workflow is not enabled
 */
export async function DELETE(
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            {message: "Unauthorized"},
            {status: 401}
        );
    }

    const internalUser = await getInternalUser(user.userId as ClerkUserId);

    if (!internalUser) {
        return NextResponse.json(
            {message: "User not found"},
            {status: 404}
        );
    }

    try {
        const workflow = await prisma.workflow.findUnique({
            where: {
                id: params.id,
                userId: internalUser.id,
            }
        });

        if (!workflow) {
            return NextResponse.json(
                {message: "Workflow not found"},
                {status: 404}
            );
        }

        if (!workflow.enabled) {
            return NextResponse.json(
                {message: "Workflow is not enabled"},
                {status: 400}
            );
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
            {message: "Workflow stopped"},
            {status: 200}
        );
    } catch (error) {
        console.error("Error stopping workflow:", error);
        return NextResponse.json(
            {message: "Error stopping workflow"},
            {status: 500}
        );
    }
}
