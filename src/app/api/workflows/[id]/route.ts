import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {validateApiWorkflowInput} from "@/utils/validateWorkflowInput";

// Schema for validating workflow update requests
// Note: Only input, name, description, enabled, and credentials can be updated
// Workflow logic (eventName, etc.) is fixed by the template
const WorkflowUpdateRequestSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    input: z.record(z.string(), z.any()).optional(),
    credentials: z.array(z.object({
        credentialId: z.string()
    })).optional(),
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   get:
 *     summary: Get a workflow
 *     description: Returns a single workflow for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single workflow.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Workflow not found.
 *       500:
 *         description: Error getting workflow.
 */
export async function GET({params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const workflow = await prisma.workflow.findFirst({
            where: {
                id: params.id,
                userId: user.userId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                input: true,
                isActive: true,
                requiredProviders: true,
                canBeScheduled: true,
                timezone: true,
                lastRunAt: true,
                cronExpressions: true,
                nextRunAt: true,
                eventName: true,
                createdAt: true,
                updatedAt: true,
                workflowCredentials: {
                    select: {
                        credential: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                config: true
                            },
                        },
                    },
                },
            },
        });

        if (!workflow) {
            return new Response('Workflow not found', {status: 404});
        }

        return new Response(JSON.stringify(workflow), {status: 200});
    } catch (error) {
        console.error('Error getting workflow:', error);
        return new Response('Error getting workflow', {status: 500});
    }
}


/**
 * @swagger
 * /api/workflows/{id}:
 *   put:
 *     summary: Update a workflow
 *     description: Updates a single workflow for the authenticated user. Validates input against the workflow template schema.
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Custom name for the workflow
 *               description:
 *                 type: string
 *                 description: Workflow description
 *               enabled:
 *                 type: boolean
 *                 description: Whether the workflow is enabled
 *               input:
 *                 type: object
 *                 description: Workflow input parameters that will be validated against template schema
 *               credentials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     credentialId:
 *                       type: string
 *                 description: Credential IDs to associate with this workflow
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowResponse'
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
 *         description: Workflow not found
 *       500:
 *         description: Error updating workflow
 */
export async function PUT(req: NextRequest, {params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            {message: "Unauthorized"},
            {status: 401}
        );
    }

    try {
        // Parse and validate request body
        const body = await req.json();
        const validationResult = WorkflowUpdateRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: "Invalid request body",
                    errors: validationResult.error.issues.map(e => e.message)
                },
                {status: 400}
            );
        }

        const {name, description, enabled, input, credentials} = validationResult.data;

        // Get existing workflow to validate input against template
        const existingWorkflow = await prisma.workflow.findUnique({
            where: {
                id: params.id,
                userId: user.userId,
            }
        });

        if (!existingWorkflow) {
            return NextResponse.json(
                {message: "Workflow not found"},
                {status: 404}
            );
        }

        // Get workflow template to validate input
        let templateId: string | undefined;
        templateId = existingWorkflow.templateId;

        // Validate workflow input
        validateApiWorkflowInput(templateId, input);

        const updatedWorkflow = await prisma.workflow.update({
            where: {
                id: params.id,
                userId: user.userId,
            },
            data: {
                ...(name !== undefined && {name}),
                ...(description !== undefined && {description}),
                ...(enabled !== undefined && {enabled}),
                ...(input !== undefined && {input: input as any}),
                ...(credentials && credentials.length > 0
                    ? {
                        workflowCredentials: {
                            deleteMany: {}, // remove old links
                            create: credentials.map((c) => ({
                                credential: {connect: {id: c.credentialId}},
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                workflowCredentials: {
                    include: {
                        credential: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                config: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(updatedWorkflow, {status: 200});
    } catch (error) {
        console.error('Error updating workflow:', error);
        return NextResponse.json(
            {message: 'Error updating workflow'},
            {status: 500}
        );
    }
}


/**
 * @swagger
 * /api/workflows/{id}:
 *   delete:
 *     summary: Delete a workflow
 *     description: Deletes a single workflow for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error deleting workflow.
 */
export async function DELETE({params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        await prisma.workflow.delete({
            where: {
                id: params.id,
                userId: user.userId,
            },
        });
        return new Response('Workflow deleted successfully', {status: 200});
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return new Response('Error deleting workflow', {status: 500});
    }
}
