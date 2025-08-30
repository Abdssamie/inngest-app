import { JsonValue } from "@prisma/client/runtime/library";
import { CredentialType } from '@prisma/client';

interface BaseCredentialPayload {
  type: CredentialType;
  metadata?: Record<string, any>;
}
// Specific credential interfaces

export interface GoogleCredentialPayload extends BaseCredentialPayload {
  type: "GOOGLE";
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
}

export interface SlackCredentialPayload extends BaseCredentialPayload {
  type: "SLACK";
  accessToken: string;
  teamId: string;
}

export interface HubspotCredentialPayload extends BaseCredentialPayload {
  type: "HUBSPOT";
  accessToken: string;
  refreshToken: string;
  hubId: string;
}
// Discriminated union type

export type DecryptedCredentialPayload =
  | GoogleCredentialPayload
  | SlackCredentialPayload
  | HubspotCredentialPayload;
// Used for API requests


export interface CredentialUpdateRequest {
  credential: DecryptedCredentialPayload;
}

export interface CredentialCreateRequest {
  name: string;
  type: CredentialType;
  credential: DecryptedCredentialPayload;
  config: JsonValue | null;
}

// Used for API responses - safe fields only
export interface SafeCredentialResponse {
  id: string;
  name: string;
  type: CredentialType;
  createdAt: Date;
  updatedAt: Date;
  config: JsonValue | null;
}

