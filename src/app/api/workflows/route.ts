import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
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
                eventName: true,
                canBeScheduled: true,
                cronExpressions: true,
                lastRunAt: true,
                nextRunAt: true,
                input: true,
                timezone: true,
                requiredProviders: true,
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
