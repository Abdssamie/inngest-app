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

                        const userId = event.user?.id;

                        if (!userId) {
                            return;
                        }

                        const workflow = await prisma.workflow.findFirst({
                            where: {
                                trigger: event.name,
                                userId: userId,
                            },
                            include: {
                                workflowCredentials: {
                                    include: {
                                        credential: true
                                    },
                                }
                            }
                        });


                        // Check if there are any credentials
                        if (workflow?.workflowCredentials?.length === 0 || workflow?.workflowCredentials === undefined || length === 0) {
                            return {
                                ctx: {
                                    credentials: [],
                                }
                            }
                        }

                        const decryptedCredentials = workflow.workflowCredentials.map((workflowCred) => (
                            {
                                data: decryptCredential(workflowCred.credential.secret),
                                type: workflowCred.credential.type,
                                id: workflowCred.credential.id,
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
