import { JsonValue } from "@prisma/client/runtime/library";
import { CredentialType, Provider } from "@prisma/client";
import {
    CredentialSecret
} from "@/lib/credentials/schema";

// Used for API requests
export interface CredentialCreateRequest {
  name: string;
  type: CredentialType;
  provider: Provider;
  secret: CredentialSecret;
  config?: JsonValue;
}

export interface CredentialUpdateRequest {
  name?: string;
  secret?: CredentialSecret;
  config?: JsonValue;
}

// Used for API responses - safe fields only
export interface SafeCredentialResponse {
  id: string;
  name: string;
  type: CredentialType;
  provider: Provider;
  createdAt: Date;
  updatedAt: Date;
  config: JsonValue | null;
}