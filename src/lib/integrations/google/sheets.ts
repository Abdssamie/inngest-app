import { google } from "googleapis";
import {GoogleService} from "@/lib/integrations/google/google";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
  throw new Error("Google OAuth client credentials not found");
}

export class SheetsService extends GoogleService {
  /**
   * Finds a Google Sheet by its name using the Google Drive API.
   * @param name The exact name of the spreadsheet to find.
   * @returns The spreadsheet ID if found, otherwise null.
   */
  async findSheetByName(name: string): Promise<string | null> {
    await this.refreshAccessTokenIfNeeded();

    const drive = google.drive({ version: "v3", auth: this.oauth2Client });

    try {
      const response = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${name}' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });

      const files = response.data.files;
      if (files && files.length > 0) {
        // Return the ID of the first matching spreadsheet
        return files[0].id || null;
      } else {
        console.log(`No spreadsheet found with name: ${name}`);
        return null;
      }
    } catch (error) {
      console.error("Error searching for sheet:", error);
      throw error;
    }
  }

  async getSheetData(spreadsheetId: string, range: string) {
    await this.refreshAccessTokenIfNeeded();

    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });
      return response.data.values;
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      throw error;
    }
  }
}
