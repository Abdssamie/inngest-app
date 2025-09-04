import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getInternalUserId } from '@/lib/helpers/getInternalUserId';
import { inngest } from '@/inngest/client';
import { ScheduleType } from '@prisma/client';

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     description: Returns a list of all schedules for the authenticated user.
 *     responses:
 *       200:
 *         description: A list of schedules.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const internalUserId = await getInternalUserId(userId as ClerkUserId);
  if (!internalUserId) {
    return new NextResponse('User not found', { status: 404 });
  }

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: userId,
      },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a new schedule
 *     description: Creates a new schedule and triggers the corresponding Inngest workflow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - cronExpression
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DAILY_REPORT]
 *               cronExpression:
 *                 type: string
 *                 example: "0 9 * * *"
 *               timezone:
 *                 type: string
 *                 example: "America/New_York"
 *               payload:
 *                 type: object
 *     responses:
 *       201:
 *         description: The created schedule.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getInternalUserId(clerkUserId as ClerkUserId);
  if (!userId) {
    return new NextResponse('User not found', { status: 404 });
  }

  try {
    const body = await req.json();
    const { type, cronExpression, timezone, payload } = body;

    // Basic validation
    if (!type || !cronExpression || !Object.values(ScheduleType).includes(type)) {
      return new NextResponse('Invalid request body. "type" and "cronExpression" are required.', { status: 400 });
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        userId: userId,
        type: type as ScheduleType,
        cronExpression: cronExpression,
        timezone: timezone,
        payload: payload,
        isActive: true, // Schedules are active by default
      },
    });

    // CRITICAL STEP: After creating the schedule, send the event to start the Inngest workflow.
    await inngest.send({
      name: 'app/schedule.requested',
      data: {
        scheduleId: newSchedule.id,
        user_id: userId,
      },
    });

    return new NextResponse(JSON.stringify(newSchedule), { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
