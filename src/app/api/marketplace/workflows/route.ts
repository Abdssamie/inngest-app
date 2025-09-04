import {NextRequest, NextResponse} from "next/server";
import {auth} from "@clerk/nextjs/server";
import {getInternalUserId} from "@/lib/helpers/getInternalUserId";
import {
    queryWorkflowTemplates
} from "@/lib/workflow-templates";
import prisma from "@/lib/prisma";

/**
 * @swagger
 * /api/marketplace/workflows:
 *   get:
 *     summary: Browse available workflow templates
 *     description: Returns paginated list of workflow templates available for installation from the marketplace.
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of templates per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search templates by name or description
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [GOOGLE, SLACK, HUBSPOT, FIRECRAWL, CUSTOM]
 *         description: Filter by required provider
 *       - in: query
 *         name: pricing
 *         schema:
 *           type: string
 *           enum: [free, paid]
 *         description: Filter by pricing type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Show only featured templates
 *     responses:
 *       200:
 *         description: Paginated list of workflow templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           canBeScheduled:
 *                             type: boolean
 *                           requiredProviders:
 *                             type: array
 *                             items:
 *                               type: string
 *                           requiredScopes:
 *                             type: object
 *                             additionalProperties:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 description: Required OAuth scopes per provider
 *                           type:
 *                             type: string
 *                             enum: [marketplace, custom]
 *                           pricing:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [free, paid]
 *                               price:
 *                                 type: number
 *                                 description: Price in cents
 *                               currency:
 *                                 type: string
 *                                 enum: [USD, EUR, GBP]
 *                               billingPeriod:
 *                                 type: string
 *                                 enum: [one_time, monthly, yearly]
 *                           category:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           featured:
 *                             type: boolean
 *                           author:
 *                             type: string
 *                           version:
 *                             type: string
 *                           isInstalled:
 *                             type: boolean
 *                           canInstall:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
    const user = await auth();

    if (!user) {
        return NextResponse.json(
            {success: false, message: "Unauthorized"},
            {status: 401}
        );
    }

    try {
        const userId = await getInternalUserId(user.userId as ClerkUserId);

        if (!userId) {
            return NextResponse.json(
                {success: false, message: "User not found"},
                {status: 404}
            );
        }

        const url = new URL(req.url);

        // Parse query parameters
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

        // Create the filters object from query params
        const filters = {
            userId,
            search: url.searchParams.get("search") || undefined,
            provider: url.searchParams.get("provider") || undefined,
            pricing: url.searchParams.get("pricing") as 'free' | 'paid' | undefined,
            category: url.searchParams.get("category") || undefined,
            featured: url.searchParams.get("featured") === "true",
        };

        // Filter templates based on query parameters
        const filteredTemplates = queryWorkflowTemplates(filters);

        // Check which templates user has already installed
        const userWorkflows = await prisma.workflow.findMany({
            where: {userId},
            select: {templateId: true}
        });

        const installedTemplatesIds = new Set(userWorkflows.map(w => w.templateId));

        // Apply pagination
        const totalTemplates = filteredTemplates.length;
        const totalPages = Math.ceil(totalTemplates / limit);
        const skip = (page - 1) * limit;
        const paginatedTemplates = filteredTemplates.slice(skip, skip + limit);

        // Enrich with installation status
        const enrichedTemplates = paginatedTemplates.map(template => ({
            ...template,
            isInstalled: installedTemplatesIds.has(template.id),
            canInstall: !installedTemplatesIds.has(template.id),
        }));

        return NextResponse.json({
            success: true,
            data: {
                items: enrichedTemplates,
                pagination: {
                    page,
                    limit,
                    total: totalTemplates,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
            message: `Found ${totalTemplates} workflow templates`,
        });
    } catch (error) {
        console.error("Error getting workflow templates:", error);
        return NextResponse.json(
            {success: false, message: "Internal server error"},
            {status: 500}
        );
    }
}