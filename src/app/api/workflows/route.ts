import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {NextRequest} from "next/server";
import {JsonValue} from "@prisma/client/runtime/library";

export async function GET() {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const workflows = await prisma.workflow.findMany({
            where: {
                userId: user.userId
            },
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                trigger: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return new Response(JSON.stringify(workflows), {status: 200});
    } catch (error) {
        console.error('Error getting workflows:', error);
        return new Response('Error getting workflows', {status: 500});
    }
}

export async function POST(req: NextRequest) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const body: {
        name: string,
        description: string,
        enabled: boolean,
        trigger: string,
        workflow: JsonValue,
    } = await req.json();

    try {
        const newWorkflow = await prisma.workflow.create({
            data: {
                name: body.name,
                description: body.description,
                enabled: body.enabled,
                trigger: body.trigger,
                workflow: body.workflow,
                userId: user.userId,
            }
        });
        return new Response(JSON.stringify(newWorkflow), {status: 201});
    } catch (error) {
        console.error('Error creating workflow:', error);
        return new Response('Error creating workflow', {status: 500});
    }
}
