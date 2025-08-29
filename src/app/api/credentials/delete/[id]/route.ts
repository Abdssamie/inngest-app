import {updateCredential} from "@/services/credentials-store"
import {NextRequest} from "next/server";
import {auth} from "@clerk/nextjs/server";


export async function POST(
    req: NextRequest,
    {params}: { params: { id: string } }
) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const id = params.id;

    const body = await req.json();

    // expected credential schema
    // {
    //   credential: object
    // }

    if (body.type)

        try {
            await updateCredential(user.userId, id, body.credential);
            return new Response('Credentials updated successfully', {status: 200});
        } catch (error) {
            console.error('Error updating credentials:', error);
            return new Response('Error updating credentials', {status: 500});
        }
}
