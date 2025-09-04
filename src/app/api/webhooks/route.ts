import {WebhookEvent} from '@clerk/nextjs/server';
import {verifyWebhook} from '@clerk/nextjs/webhooks';
import {NextRequest} from 'next/server';
import prisma from '@/lib/prisma';
import {createDefaultWorkflows} from "@/inngest/functions/workflows";


/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Clerk webhook
 *     description: Handles Clerk webhooks.
 *     responses:
 *       200:
 *         description: Webhook received.
 *       400:
 *         description: Error verifying webhook.
 *       500:
 *         description: Error processing webhook.
 */
export async function POST(req: NextRequest) {
    console.log('Webhook POST request received.');
    try {
        const evt = (await verifyWebhook(req)) as WebhookEvent;

        const {id} = evt.data;
        const eventType = evt.type;

        console.log(
            `Received webhook with ID ${id} and event type of ${eventType}`
        );
        console.log('Webhook payload:', JSON.stringify(evt.data, null, 2));

        if (evt.type === 'user.created') {
            console.log("Processing 'user.created' event.");

            const name = evt.data.first_name + ' ' + evt.data.last_name;

            const primaryEmail = evt.data.email_addresses.find(
                (e) => e.id === evt.data.primary_email_address_id
            )?.email_address;
            if (!primaryEmail) {
                console.error('Primary email address not found for user.');
                return new Response('Primary email address not found for user', {
                    status: 400
                });
            }
            console.log(`Primary email found: ${primaryEmail}`);

            try {
                const user = await prisma.user.create({
                    data: {
                        clerk_id: id,
                        email: primaryEmail,
                        name: name,
                    }
                });
                console.log('Successfully created user in Database with ID:', id);

                createDefaultWorkflows(user.id as InternalUserId);

                console.log('Successfully created default workflows for user with ID:', id);

            } catch (error) {
                console.error(
                    'Caught exception while creating user in the database',
                    JSON.stringify(error, null, 2)
                );
                return new Response('Error creating user in the database', {status: 500});
            }
        } else if (evt.type === 'user.deleted') {

            console.log(`Attempting to delete user with ID: ${evt.data.id}`);
            try {
                await prisma.user.delete({
                        where: {
                            clerk_id: id
                        }
                    })

                console.log(
                    'Successfully deleted user in the database with ID:',
                    evt.data.id
                );
            } catch
                (error) {
                console.error(
                    'Caught exception while deleting user from the database:',
                    JSON.stringify(error, null, 2)
                );
                return new Response('Error deleting user from the database', {
                    status: 500
                });
            }
        } else if (evt.type === 'user.updated') {
            console.log(`Attempting to update user with ID: ${evt.data.id}`);
            try {
                await prisma.user.update({
                    where: {
                        clerk_id: id
                    },
                    data: {
                        name: evt.data.first_name + ' ' + evt.data.last_name,
                        email: evt.data.email_addresses.find(
                            (e) => e.id === evt.data.primary_email_address_id
                        )?.email_address,
                    }
                });

                console.log(
                    'Successfully updated user in the database with ID:',
                    evt.data.id
                );
            } catch
                (error) {
                console.error(
                    'Caught exception while updating user from the database:',
                    JSON.stringify(error, null, 2)
                );
                return new Response('Error updating user from the database', {
                    status: 500
                });
            }
        }
        console.log('Webhook processing finished successfully.');
        return new Response('Webhook received', {status: 200});
    } catch
        (err) {
        console.error('Error verifying webhook:', JSON.stringify(err, null, 2));
        return new Response('Error verifying webhook', {status: 400});
    }
}
