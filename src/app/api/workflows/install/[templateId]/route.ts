import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkflowTemplate } from "@/lib/workflow-templates";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";
import prisma from "@/lib/prisma";

/**
 * @swagger
 * /api/workflows/install/{templateId}:
 *   post:
 *     summary: Install a workflow template
 *     description: Creates a new workflow instance from a marketplace template for the authenticated user.
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow template ID to install
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Custom name for this workflow instance
 *     responses:
 *       201:
 *         description: Workflow template installed successfully
 *       400:
 *         description: Invalid template or validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found or user not found
 *       409:
 *         description: Template already installed
 *       500:
 *         description: Internal server error
 */
export async function POST(
    req: NextRequest,
    {params}: { params: { templateId: string } }
) {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            {success: false, message: "Unauthorized"},
            {status: 401}
        );
    }

    const userId = await getInternalUserId(user.userId as ClerkUserId);

    if (!userId) {
        return NextResponse.json(
            {success: false, message: "User not found"},
            {status: 404}
        );
    }

    try {
        const body = await req.json();
        const { name } = body;

        // Get the template definition
        const template = getWorkflowTemplate(params.templateId);
        if (!template) {
            return NextResponse.json(
                {success: false, message: "Workflow template not found"},
                {status: 404}
            );
        }

        // Check if user already has this template installed
        const existingWorkflow = await prisma.workflow.findFirst({
            where: {
                userId: userId,
                templateId: params.templateId
            },
        });

        if (existingWorkflow) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This workflow template is already installed",
                    data: {existingWorkflowId: existingWorkflow.id}
                },
                {status: 409}
            );
        }

        // Install the workflow (create instance)
        const workflow = await prisma.workflow.create({
            data: {
                userId: userId as string,
                templateId: template.id,
                name: name || template.name,
                description: template.description,
                enabled: true, // User can use this workflow
                isActive: false, // Not scheduled by default
                canBeScheduled: template.canBeScheduled,
                cronExpressions: [],
                timezone: "UTC",
                input: {},
                eventName: template.eventName,
                requiredProviders: template.requiredProviders,
                config: {
                    templateId: params.templateId,
                    type: template.type,
                    pricing: template.pricing,
                    category: template.category,
                    tags: template.tags,
                    featured: template.featured,
                    author: template.author,
                    version: template.version,
                    installedAt: new Date().toISOString(),
                }
            },
        });

        const response = {
            ...workflow,
            template: template,
        };

        return NextResponse.json(
            {
                success: true,
                data: response,
                message: `Workflow template '${template.name}' installed successfully`,
            },
            {status: 201}
        );
    } catch (error) {
        console.error('Error installing workflow template:', error);

        return NextResponse.json(
            {success: false, message: 'Error installing workflow template'},
            {status: 500}
        );
    }
}
