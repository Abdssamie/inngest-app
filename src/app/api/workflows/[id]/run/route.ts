import {isEventKey, Events, inngest, SchedulableEventPayload} from "@/inngest/client";
import {auth} from "@clerk/nextjs/server";
import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {getInternalUser} from "@/lib/helpers/getInternalUser";
import {z} from "zod";
import {validateApiWorkflowInput} from "@/utils/validateWorkflowInput";

// Schema for validating workflow run requests
const WorkflowRunRequestSchema = z.object({
    input: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});


/**
 * @swagger
 * /api/workflows/{id}/run:
 *   post:
 *     summary: Run a workflow immediately
 *     description: Executes a workflow immediately by its ID for the authenticated user. Validates workflow input against the template schema. This also works for event based workflows that listen to changes in the user data.
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID to run
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
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the workflow execution
 *     responses:
 *       200:
 *         description: Workflow run successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Workflow run successfully"
 *       400:
 *         description: Input validation failed
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
 *         description: Error running workflow
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
        const validationResult = WorkflowRunRequestSchema.safeParse(requestBody);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: "Invalid request body",
                    errors: validationResult.error.issues.map(e => e.message)
                },
                {status: 400}
            );
        }

        const {input, metadata} = validationResult.data;

        const workflow = await prisma.workflow.findUnique({
            where: {
                id: params.id,
                userId: internalUser.id,
            },
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

        validateApiWorkflowInput(templateId, input);

        if (!isEventKey(workflow.eventName)) {
            return NextResponse.json(
                {message: "Invalid workflow event name"},
                {status: 500}
            );
        }

        // Send an event to Inngest to trigger the workflow
        await inngest.send({
            name: workflow.eventName as any,  // This is safe because we checked it above
            user: internalUser,
            data: {
                user_id: internalUser.id as InternalUserId,
                input: input || workflow.input,
                scheduledRun: false,
                workflowId: workflow.id,
                cronExpression: null,
                tz: workflow.timezone,
                metadata: metadata
            },
        } satisfies SchedulableEventPayload & { name: keyof Events });

        return NextResponse.json(
            {message: "Workflow run successfully"},
            {status: 200}
        );
    } catch (error) {
        console.error("Error running workflow:", error);
        return NextResponse.json(
            {message: "Error running workflow"},
            {status: 500}
        );
    }
}
