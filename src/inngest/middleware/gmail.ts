import {InngestMiddleware} from "inngest";
import {$Enums, CredentialType, User} from "@prisma/client";
import {GmailService} from "@/lib/integrations/google/gmail";
import {GoogleCredentialPayload} from "@/types/credentials/credential-types";
import {JsonValue} from "@prisma/client/runtime/binary";

// This middleware depends on the `credentialMiddleware` having already run and
// populated `ctx.credentials`.
export const gmailMiddleware = new InngestMiddleware({
    name: "Gmail Middleware",
    init() {
        return {
            onFunctionRun() {
                return {
                    transformInput({ctx}) {
                        // If credentials aren't in the context, do nothing.
                        const credentials = ctx.credentials as {
                            secret: any;
                            data: object;
                            name: string;
                            userId: string;
                            type: $Enums.CredentialType;
                            id: string;
                            config: JsonValue | null;
                            createdAt: Date;
                            updatedAt: Date;
                        }[];

                        const user = ctx.event.user as User;

                        if (!user || credentials) {
                            return;
                        }

                        // Find the first decrypted Google credential in the context.
                        const googleCredential = credentials.find(
                            (cred) => cred.type === CredentialType.GOOGLE
                        );

                        if (!googleCredential) {
                            return;
                        }

                        const gmailService = new GmailService(
                            user.id,
                            googleCredential.id,
                            googleCredential.data as GoogleCredentialPayload,
                        );

                        return {
                            ctx: {
                                gmail: gmailService,
                            },
                        };
                    },
                };
            },
        };
    },
});
