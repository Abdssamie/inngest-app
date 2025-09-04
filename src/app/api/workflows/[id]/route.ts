import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {NextRequest} from "next/server";
import {JsonValue} from "@prisma/client/runtime/library";

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
export async function GET(req: NextRequest, {params}: { params: { id: string } }) {
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
 *     description: Updates a single workflow for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowUpdateRequest'
 *     responses:
 *       200:
 *         description: The updated workflow.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error updating workflow.
 */
export async function PUT(req: NextRequest, {params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const body: {
        name: string;
        description: string;
        enabled: boolean;
        eventName: string;
        workflow: JsonValue;
        credentials?: { credentialId: string }[]; // optional
    } = await req.json();

    try {
        const updatedWorkflow = await prisma.workflow.update({
            where: {
                id: params.id,
                userId: user.userId,
            },
            data: {
                name: body.name,
                description: body.description,
                enabled: body.enabled,
                eventName: body.eventName,
                ...(body.credentials && body.credentials.length > 0
                    ? {
                        workflowCredentials: {
                            deleteMany: {}, // remove old links
                            create: body.credentials.map((c) => ({
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

        return new Response(JSON.stringify(updatedWorkflow), {status: 200});
    } catch (error) {
        console.error('Error updating workflow:', error);
        return new Response('Error updating workflow', {status: 500});
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
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await auth();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await prisma.workflow.delete({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });
    return new Response('Workflow deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return new Response('Error deleting workflow', { status: 500 });
  }
}
