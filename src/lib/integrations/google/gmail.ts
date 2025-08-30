import { google } from "googleapis";
import { updateCredential } from "@/services/credentials-store";
import { GoogleCredentialPayload } from "@/types/credentials/credential-types";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
  throw new Error("Google OAuth client credentials not found");
}

export class GmailService {
  private readonly oauth2Client : OAuth2Client;
  private readonly credentialId: string;
  private credentialPayload: GoogleCredentialPayload;
  private readonly userId: string;

  constructor(
    userId: string,
    credentialId: string,
    credentialPayload: GoogleCredentialPayload
  ) {
    this.userId = userId;
    this.credentialId = credentialId;
    this.credentialPayload = credentialPayload;

    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET
    );
    
    this.oauth2Client.setCredentials({
      access_token: this.credentialPayload.accessToken,
      refresh_token: this.credentialPayload.refreshToken,
    });
  }

  private async refreshAccessTokenIfNeeded(): Promise<void> {
    const isTokenExpired = this.credentialPayload.expiresIn <= Date.now();
    if (!isTokenExpired) {
      return;
    }

    console.log(`Token for credential ${this.credentialId} has expired. Refreshing...`);

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token;
      const newExpiresIn = credentials.expiry_date;

      if (!newAccessToken || !newExpiresIn) {
        throw new Error("Failed to refresh access token, new tokens are missing.");
      }
      
      this.oauth2Client.setCredentials({
          access_token: newAccessToken,
          refresh_token: this.credentialPayload.refreshToken, // The refresh token itself doesn't change
      });

      const updatedPayload: GoogleCredentialPayload = {
        ...this.credentialPayload,
        accessToken: newAccessToken,
        expiresIn: newExpiresIn,
      };

      await updateCredential(this.userId, this.credentialId, updatedPayload);
      
      // Update the instance's payload
      this.credentialPayload = updatedPayload;

      console.log(`Successfully refreshed token for credential ${this.credentialId}`);
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Could not refresh access token. The user may need to re-authenticate.");
    }
  }

  async sendMail(to: string, subject: string, message: string) {
    await this.refreshAccessTokenIfNeeded();

    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });
      console.log("Email sent:", res.data);
      return res.data;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}
