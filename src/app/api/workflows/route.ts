import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: Get user's workflows
 *     description: Returns a list of all workflows for the authenticated user.
 *     tags: [Workflows]
 *     responses:
 *       200:
 *         description: List of user workflows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       canBeScheduled:
 *                         type: boolean
 *                       eventName:
 *                         type: string
 *                       cronExpressions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       timezone:
 *                         type: string
 *                       lastRunAt:
 *                         type: string
 *                         format: date-time
 *                       nextRunAt:
 *                         type: string
 *                         format: date-time
 *                       input:
 *                         type: object
 *                       requiredProviders:
 *                         type: array
 *                         items:
 *                           type: string
 *                       credentials:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                             provider:
 *                               type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return NextResponse.json(
            { success: false, message: "Internal Server Error: User not found. This error comes from us. We'll fix it asap." },
            { status: 505 }
        );
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
                isActive: true,
                canBeScheduled: true,
                eventName: true,
                cronExpressions: true,
                timezone: true,
                lastRunAt: true,
                nextRunAt: true,
                input: true,
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
                                provider: true,
                                config: true,
                            }
                        }
                    }
                },
            }
        });

        // Simple transformation to flatten credentials
        const userWorkflows = workflows.map(workflow => ({
            ...workflow,
            credentials: workflow.workflowCredentials.map(wc => wc.credential),
        }));

        return NextResponse.json({
            success: true,
            data: userWorkflows,
            message: `Found ${workflows.length} workflows`,
        });
    } catch (error) {
        console.error('Error getting workflows:', error);
        return NextResponse.json(
            { success: false, message: 'Error getting workflows' },
            { status: 500 }
        );
    }
}