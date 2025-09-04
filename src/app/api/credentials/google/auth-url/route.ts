import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";
import { getInternalUserId } from "@/lib/helpers/getInternalUserId";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_OAUTH_REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL;

if (
  !GOOGLE_OAUTH_CLIENT_ID ||
  !GOOGLE_OAUTH_CLIENT_SECRET ||
  !GOOGLE_OAUTH_REDIRECT_URL
) {
  throw new Error("Google OAuth credentials not found in .env file");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URL
);

/**
 * @swagger
 * /api/google/auth-url:
 *   get:
 *     summary: Get Google OAuth URL from specified scopes
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: scopes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         required: true
 *     description: Returns a Google OAuth URL for the authenticated user.
 *     responses:
 *       200:
 *         description: A Google OAuth URL.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scopes = searchParams.getAll("scopes");

  try {
    const user = await auth();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = await getInternalUserId(user.userId as ClerkUserId);

    if (!id) {
      return new Response("User not found", { status: 404 });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      // Pass the user's ID to the state parameter so we can identify them on callback
      state: id,
      prompt: "consent", // This will ensure the user is prompted for consent every time, which is useful for getting a refresh token.
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
