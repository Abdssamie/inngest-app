import {getAllUserCredentials, storeCredential} from "@/services/credentials-store"
import {auth} from "@clerk/nextjs/server";
import {NextRequest} from "next/server";
import {CredentialCreateRequest} from "@/types/credentials/credential-types";


export async function GET() {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    try {
        const credentials = await getAllUserCredentials(user.userId);

        return new Response(JSON.stringify(credentials), {status: 200});
    } catch (error) {
        console.error('Error getting credentials:', error);
        return new Response('Error getting credentials', {status: 500});
    }
}

export async function POST(req: NextRequest) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const body: CredentialCreateRequest = await req.json();

    try {
        const newCredential = await storeCredential(user.userId, body);
        return new Response(JSON.stringify(newCredential), {status: 201});
    } catch (error) {
        console.error('Error storing credentials:', error);
        return new Response('Error storing credentials', {status: 500});
    }
}
