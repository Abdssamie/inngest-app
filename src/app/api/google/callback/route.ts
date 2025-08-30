import { NextResponse } from "next/server";
import { google } from "googleapis";
import { storeCredential } from "@/services/credentials-store";
import {
  CredentialCreateRequest,
  DecryptedCredentialPayload,
} from "@/types/credentials/credential-types";
import { CredentialType } from "@prisma/client";

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
 * /api/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the Google OAuth callback.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to the integrations page.
 *       400:
 *         description: Missing code or state from Google OAuth callback.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the internal userId
  if (!code || !state) {
    return new NextResponse("Missing code or state from Google OAuth callback", {
      status: 400,
    });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's email to name the credential
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error("Could not retrieve user email from Google.");
    }

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date || !tokens.scope) {
        throw new Error("Incomplete token data from Google.");
    }

    const credentialPayload: DecryptedCredentialPayload = {
      type: CredentialType.GOOGLE,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date,
      scopes: tokens.scope.split(" "),
    };

    const createRequest: CredentialCreateRequest = {
      name: `Google (${userInfo.email})`,
      type: CredentialType.GOOGLE,
      credential: credentialPayload,
      config: null,
    };

    await storeCredential(state as InternalUserId, createRequest);

    // Redirect user back to the integrations page in the app
    const redirectUrl = new URL("/dashboard/integrations", origin);
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error("Error processing Google OAuth callback:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
