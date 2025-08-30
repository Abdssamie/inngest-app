import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { JsonValue } from "@prisma/client/runtime/library";
import { SafeCredentialResponse } from "@/types/credentials/credential-types";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: Get all workflows
 *     description: Returns a list of all workflows for the authenticated user.
 *     responses:
 *       200:
 *         description: A list of workflows.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error getting workflows.
 */
export async function GET() {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    try {
        const workflows = await prisma.workflow.findMany({
            where: {
                userId: id
            },
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                workflow: true,
                trigger: true,
                createdAt: true,
                updatedAt: true,
                workflowCredentials: {
                    select: {
                        credential: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                createdAt: true,
                                updatedAt: true,
                                config: true,
                            }
                        }
                    }
                },
            }
        });

        return new Response(JSON.stringify(workflows), { status: 200 });
    } catch (error) {
        console.error('Error getting workflows:', error);
        return new Response('Error getting workflows', { status: 500 });
    }
}

/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Create a new workflow
 *     description: Creates a new workflow for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowCreateRequest'
 *     responses:
 *       201:
 *         description: The created workflow.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error creating workflow.
 */
export async function POST(req: NextRequest) {
    const user = await auth();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    const body: {
        name: string;
        description: string;
        enabled: boolean;
        trigger: string;
        workflow: JsonValue;
        credentials?: { credentialId: string }[];
    } = await req.json();

    try {
        const workflowData: any = {
            name: body.name,
            description: body.description,
            enabled: body.enabled,
            trigger: body.trigger,
            workflow: body.workflow,
            userId: id,
        };

        if (body.credentials && body.credentials.length > 0) {
            workflowData.workflowCredentials = {
                create: body.credentials.map((cred) => ({
                    credential: { connect: { id: cred.credentialId } },
                })),
            };
        }

        const newWorkflow = await prisma.workflow.create({
            data: workflowData,
            include: {
                workflowCredentials: {
                    include: { credential: true },
                },
            },
        });

        return new Response(JSON.stringify(newWorkflow), { status: 201 });
    } catch (error) {
        console.error("Error creating workflow:", error);
        return new Response("Error creating workflow", { status: 500 });
    }
}
