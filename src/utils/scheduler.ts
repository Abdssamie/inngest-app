import  parser from 'cron-parser';


// Maybe add error handling for invalid cron expressions
export async function scheduleNextRun(step, event, eventName, { id, cronExpression, tz }) {
    try {
        const interval = parser.parse(cronExpression, {
            currentDate: new Date(),
            tz: tz || "UTC",
        });
        
        let nextRun = interval.next().toDate();
        
        // anti-collision logic
        if (nextRun.getMilliseconds() === 0) {
            nextRun = new Date(nextRun.getTime() + 1);
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
    } catch (error) {
        // Log error and maybe send to monitoring
        console.error("Scheduling error:", error);
        throw error;
    }
}