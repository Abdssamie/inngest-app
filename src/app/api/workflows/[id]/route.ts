import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {NextRequest} from "next/server";
import {JsonValue} from "@prisma/client/runtime/library";

export async function GET(req: NextRequest, {params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const workflow = await prisma.workflow.findUnique({
            where: {
                id: params.id,
                userId: user.userId,
            }
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

export async function PUT(req: NextRequest, {params}: { params: { id: string } }) {
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
        const updatedWorkflow = await prisma.workflow.update({
            where: {
                id: params.id,
                userId: user.userId,
            },
            data: {
                name: body.name,
                description: body.description,
                enabled: body.enabled,
                trigger: body.trigger,
                workflow: body.workflow,
            }
        });
        return new Response(JSON.stringify(updatedWorkflow), {status: 200});
    } catch (error) {
        console.error('Error updating workflow:', error);
        return new Response('Error updating workflow', {status: 500});
    }
}

export async function DELETE(req: NextRequest, {params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        await prisma.workflow.delete({
            where: {
                id: params.id,
                userId: user.userId,
            }
        });
        return new Response('Workflow deleted successfully', {status: 200});
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return new Response('Error deleting workflow', {status: 500});
    }
}
