import { inngest } from "../client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "hello.world" },
  async ({ event, step, credentials, prisma, gmail}) => {
    gmail.sendMail("test@example.com", "Hello World", "Hello World",);
    
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.message}!`, };
  },
);