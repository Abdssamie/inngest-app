import { inngest, Events } from "@/inngest/client";
import prisma from "@/lib/prisma";
import CronExpressionParser from "cron-parser";
import { ScheduleEventPayload } from "@/inngest/client";


/**
 * STEP 1: Handle new schedule creation or updates.
 * This calculates the first run and schedules it.
 */
export const handleScheduleRequest = inngest.createFunction(
    { id: "handle-schedule-request" },
    { event: "app/schedule/run" },
    async ({ step, event, logger }) => {
        const { scheduleId } = event.data;

        // Makes sure the schedule exist in the database and is active.
        logger.info({ scheduleId }, "Fetching schedule.");

        const schedule = await step.run("fetch-schedule", () =>
            prisma.schedule.findUnique({
                where: {
                    id: scheduleId,
                    userId: event.user.id
                }
            })
        );

        if (!schedule || !schedule.isActive) {
            logger.error("Unexpected Error!");
            logger.error({ scheduleId }, "Schedule is inactive or missing.");
            throw new Error("Schedule is inactive or missing.");
        }

        // Calculate first run time
        const firstRunRaw = await step.run("calculate-first-run", () =>
            CronExpressionParser.parse(schedule.cronExpression, {
                tz: schedule.timezone || "UTC",
            }).next().toDate()
        );

        // for some reason step.run() converts Date to string
        // so we need to convert it back to Date
        const firstRun = new Date(firstRunRaw); // convert back to Date

        logger.info({ scheduleId, firstRun }, "Scheduling first run.");

        // Schedule the first run
        switch (schedule.eventName) {
                    case "app/schedule/run":
                        await step.sendEvent("send-app-schedule-run", {
                            name: "app/schedule/run",
                            user: event.user,
                            data: {
                                user_id: schedule.userId as InternalUserId,
                                scheduleId: schedule.id,
                            }
                        });
                        break;
                    case "app/schedule/report.requested":
                        await step.sendEvent("send-app-schedule-report-requested", {
                            name: "app/schedule/report.requested",
                            user: event.user,
                            data: {
                                user_id: schedule.userId as InternalUserId,
                                scheduleId: schedule.id,
                            }
                        });
                        break;
                    default:
                        // We can't easily validate this at compile time.
                        // TODO: Look into a way to enforce this.
                        logger.error({ eventName: schedule.eventName }, "Unknown event name for schedule");
                        throw new Error(`Unknown event ${schedule.eventName}`);
                }
          
    }
);