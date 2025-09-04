import { google } from "googleapis";
import {GoogleService} from "@/services/integrations/google/google";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
  throw new Error("Google OAuth client credentials not found");
}

export class GmailService extends GoogleService {
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
