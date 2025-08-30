import {getAllUserCredentials, storeCredential} from "@/services/credentials-store"
import {auth} from "@clerk/nextjs/server";
import {NextRequest} from "next/server";
import {CredentialCreateRequest} from "@/types/credentials/credential-types";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";


/**
 * @swagger
 * /api/credentials:
 *   get:
 *     summary: Get all user credentials
 *     description: Returns a list of all credentials for the authenticated user.
 *     responses:
 *       200:
 *         description: A list of credentials.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error getting credentials.
 */
export async function GET() {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    try {
        const credentials = await getAllUserCredentials(id as InternalUserId);

        return new Response(JSON.stringify(credentials), {status: 200});
    } catch (error) {
        console.error('Error getting credentials:', error);
        return new Response('Error getting credentials', {status: 500});
    }
}

/**
 * @swagger
 * /api/credentials:
 *   post:
 *     summary: Store a new credential
 *     description: Stores a new credential for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CredentialCreateRequest'
 *     responses:
 *       201:
 *         description: The created credential.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error storing credentials.
 */
export async function POST(req: NextRequest) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    const body: CredentialCreateRequest = await req.json();

    try {
        const newCredential = await storeCredential(id as InternalUserId, body);
        return new Response(JSON.stringify(newCredential), {status: 201});
    } catch (error) {
        console.error('Error storing credentials:', error);
        return new Response('Error storing credentials', {status: 500});
    }
}
