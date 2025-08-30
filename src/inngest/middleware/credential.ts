import { InngestMiddleware } from "inngest";
import prisma from "@/lib/prisma";
import { decryptCredential } from "@/services/encrypt-credentials";


export const credentialMiddleware = new InngestMiddleware({
    name: "Credential Middleware",
    init() {
        return {
            async onFunctionRun() {
                return {
                    async transformInput({ ctx }) {
                        const { event } = ctx;
                        const { credentialsId } = event.data;
                        const userId = event.user?.id;
                        
                        if (!credentialsId || !userId) {
                            return;
                        }

                        const credentials = await prisma.credential.findMany({
                            where: {
                                id: credentialsId,
                                userId: userId,
                            },
                        });


                        const decryptedCredentials = credentials.map((cred) => (
                            {
                                ...cred,
                                secret: undefined,
                                data: decryptCredential(cred.secret)
                            }
                        ));

                        return {
                            ctx: {
                                credentials: decryptedCredentials,
                            }
                        };

                    }
                }
            },
        };
    },
});
