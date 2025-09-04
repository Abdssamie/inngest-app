import {getCredential, updateCredential, deleteCredential} from "@/services/credentials-store"
import {auth} from "@clerk/nextjs/server";
import {NextRequest} from "next/server";
import {CredentialUpdateRequest} from "@/types/credentials/credential-types";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";
import { validateCredentialSecret } from "@/lib/credentials/schema";


/**
 * @swagger
 * /api/credentials/{id}:
 *   get:
 *     summary: Get a credential
 *     description: Returns a single credential for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single credential.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Credential not found.
 *       500:
 *         description: Error getting credential.
 */
export async function GET({params}: { params: { id: string } }) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    try {
        const credential = await getCredential(id as InternalUserId, params.id);
        if (!credential) {
            return new Response('Credential not found', {status: 404});
        }
        return new Response(JSON.stringify(credential), {status: 200});
    } catch (error) {
        console.error('Error getting credential:', error);
        return new Response('Error getting credential', {status: 500});
    }
}

/**
 * @swagger
 * /api/credentials/{id}:
 *   put:
 *     summary: Update a credential that is of type ApiKey
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     description: Updates a single credential for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CredentialUpdateRequest'
 *     responses:
 *       200:
 *         description: The updated credential.
 *       400:
 *         description: Missing credential in request body.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error updating credentials.
 */
export async function PUT(
    req: NextRequest,
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    try {
        const body: CredentialUpdateRequest = await req.json();

        if (!body || !body.secret) {
            return new Response('Missing credential in request body', {status: 400});
        }
        
        const credential = await getCredential(id as InternalUserId, params.id);
        if (!credential) {
            return new Response('Credential not found', {status: 404});
        }

        if (credential.type === 'OAUTH') {
            return new Response('OAuth credentials cannot be updated directly', {status: 400});
        }

        const validationResult = validateCredentialSecret(credential.type, credential.provider, body.secret);

        if (!validationResult.success) {
            return new Response(JSON.stringify({error: validationResult.error}), {status: 400});
        }
        
        const updatedCredential = await updateCredential(id as InternalUserId, params.id, body.secret);

        return new Response(JSON.stringify(updatedCredential), {status: 200});
    } catch (error) {
        console.error('Credential update error:', error);
        return new Response('Error updating credentials', {status: 500});
    }
}


/**
 * @swagger
 * /api/credentials/{id}:
 *   delete:
 *     summary: Delete a credential
 *     description: Deletes a single credential for the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credentials deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error deleting credentials.
 */
export async function DELETE(
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
        return new Response("User not found", { status: 404 });
    }

    try {
        await deleteCredential(id as InternalUserId, params.id);
        return new Response('Credentials deleted successfully', {status: 200});
    } catch (error) {
        console.error('Error deleting credentials:', error);
        return new Response('Error deleting credentials', {status: 500});
    }
}
