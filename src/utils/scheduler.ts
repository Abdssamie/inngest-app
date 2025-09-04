import parser from "cron-parser";

export async function scheduleNextRun(step, event, eventName, { id, cronExpression, tz }) {
    const interval = parser.parse(cronExpression, {
        currentDate: new Date(),
        tz: tz || "UTC",
    });

    let nextRun = interval.next().toDate();

    // Nudge forward by 1 millisecond to prevent same-tick collisions
    // Ensure milliseconds exist (set to 0 if missing)
    // This is just to avoid running the same event twice at the same time
    if (nextRun.getMilliseconds() === 0) {
        nextRun = new Date(nextRun.getTime() + 1); // nudge by 1ms
    }

    await step.sleepUntil(`${id}-sleep-until-next-run`, nextRun);

    await step.sendEvent("schedule-next-run", {
        name: eventName,
        user: event.user,
        data: {
            ...event.data,
            scheduledRun: true,
        },
    });

    return nextRun;
}
