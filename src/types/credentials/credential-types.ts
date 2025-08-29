import { CredentialType } from '@prisma/client';

// Base credential with Discriminated Union
interface BaseCredentialPayload {
  type: CredentialType;
  metadata?: Record<string, any>;
}

// Specific credential interfaces
interface GoogleCredentialPayload extends BaseCredentialPayload {
  type: "GOOGLE";
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
}

interface SlackCredentialPayload extends BaseCredentialPayload {
  type: "SLACK";
  accessToken: string;
  teamId: string;
}

interface HubspotCredentialPayload extends BaseCredentialPayload {
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


import { JsonValue } from "@prisma/client/runtime/library";

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
