import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloWorld } from "@/inngest/functions/hello-world";

/**
 * @swagger
 * /api/inngest:
 *   get:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 *   post:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 *   put:
 *     summary: Inngest endpoint
 *     description: Inngest endpoint.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld, // <-- This is where you'll always add all your functions
  ],
});
