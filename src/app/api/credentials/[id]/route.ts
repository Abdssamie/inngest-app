import {storeCredential} from "@/services/credentials-store"
import {NextRequest} from "next/server";
import {auth} from "@clerk/nextjs/server";


export async function POST(req: NextRequest) {
    const user = await auth();

    if (!user) {
        return new Response('Unauthorized', {status: 401});
    }

    const body = await req.json();

    // expected credential schem
    // {
    //   type: "google" | "github"
    //   credential: object
    // }

    try {
        await storeCredential(user.userId, body.credential, body.type);
        return new Response('Credentials stored successfully', {status: 200});
    } catch (error) {
        console.error('Error storing credentials:', error);
        return new Response('Error storing credentials', {status: 500});
    }
}
