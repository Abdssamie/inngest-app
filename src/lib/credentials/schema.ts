import {z} from "zod";
import {CredentialType, Provider} from "@prisma/client";

// Base schemas
export const BaseOAuthSecretSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number().optional(),
    scopes: z.array(z.string()).optional(),
});

export const BaseApiKeySecretSchema = z.object({
    apiKey: z.string(),
});

// Specific schemas
export const GoogleOAuthSecretSchema = BaseOAuthSecretSchema.extend({
    scopes: z.array(z.string()),
    expiresIn: z.number(),
    refreshToken: z.string(),
});

export const SlackOAuthSecretSchema = BaseOAuthSecretSchema.extend({
    teamId: z.string(),
});

export const HubspotOAuthSecretSchema = BaseOAuthSecretSchema.extend({
    refreshToken: z.string(),
    hubId: z.string(),
});

export const FirecrawlApiKeySecretSchema = BaseApiKeySecretSchema.extend({});

export const CustomApiKeySecretSchema = BaseApiKeySecretSchema.extend({
    apiUrl: z.string().optional(),
});

// Union of all secret schemas
export const CredentialSecretSchema = z.union([
    GoogleOAuthSecretSchema,
    SlackOAuthSecretSchema,
    HubspotOAuthSecretSchema,
    FirecrawlApiKeySecretSchema,
    CustomApiKeySecretSchema,
]);

// Infer types from schemas
export type BaseOAuthSecret = z.infer<typeof BaseOAuthSecretSchema>;
export type BaseApiKeySecret = z.infer<typeof BaseApiKeySecretSchema>;
export type GoogleOAuthSecret = z.infer<typeof GoogleOAuthSecretSchema>;
export type SlackOAuthSecret = z.infer<typeof SlackOAuthSecretSchema>;
export type HubspotOAuthSecret = z.infer<typeof HubspotOAuthSecretSchema>;
export type FirecrawlApiKeySecret = z.infer<typeof FirecrawlApiKeySecretSchema>;
export type CustomApiKeySecret = z.infer<typeof CustomApiKeySecretSchema>;
export type CredentialSecret = z.infer<typeof CredentialSecretSchema>;


// Validator function
export const validateCredentialSecret = (
    type: CredentialType,
    provider: Provider,
    secret: any
) => {
    switch (type) {
        case "OAUTH":
            switch (provider) {
                case "GOOGLE":
                    return GoogleOAuthSecretSchema.safeParse(secret);
                case "SLACK":
                    return SlackOAuthSecretSchema.safeParse(secret);
                case "HUBSPOT":
                    return HubspotOAuthSecretSchema.safeParse(secret);
                default:
                    return {success: false, error: "Unsupported OAuth provider"};
            }
        case "API_KEY":
            switch (provider) {
                case "FIRECRAWL":
                    return FirecrawlApiKeySecretSchema.safeParse(secret);
                case "CUSTOM":
                    return CustomApiKeySecretSchema.safeParse(secret);
                default:
                    return {success: false, error: "Unsupported API Key provider"};
            }
        default:
            return {success: false, error: "Invalid credential type"};
    }
};
