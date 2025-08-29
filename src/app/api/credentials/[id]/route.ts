import {getCredential, updateCredential, deleteCredential} from "@/services/credentials-store"
import {auth} from "@clerk/nextjs/server";
import {NextRequest} from "next/server";
import {CredentialUpdateRequest} from "@/types/credentials/credential-types";


export async function GET(req: NextRequest, {params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const credential = await getCredential(user.userId, params.id);
        if (!credential) {
            return new Response('Credential not found', {status: 404});
        }
        return new Response(JSON.stringify(credential), {status: 200});
    } catch (error) {
        console.error('Error getting credential:', error);
        return new Response('Error getting credential', {status: 500});
    }
}

export async function PUT(
    req: NextRequest,
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const body: CredentialUpdateRequest = await req.json();

        if (!body || !body.credential) {
            return new Response('Missing credential in request body', {status: 400});
        }

        const updatedCredential = await updateCredential(user.userId, params.id, body.credential);

        return new Response(JSON.stringify(updatedCredential), {status: 200});
    } catch (error) {
        console.error('Credential update error:', error);
        return new Response('Error updating credentials', {status: 500});
    }
}

export async function DELETE(
    req: NextRequest,
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        await deleteCredential(user.userId, params.id);
        return new Response('Credentials deleted successfully', {status: 200});
    } catch (error) {
        console.error('Error deleting credentials:', error);
        return new Response('Error deleting credentials', {status: 500});
    }
}
