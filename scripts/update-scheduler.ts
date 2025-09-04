import { Project, SyntaxKind, PropertySignature } from "ts-morph";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const project = new Project({
        tsConfigFilePath: path.join(__dirname, "../tsconfig.json"),
    });
    const clientSourceFile = project.addSourceFileAtPath(path.join(__dirname, "../src/inngest/client.ts"));
    const schedulerRunnerSourceFile = project.addSourceFileAtPath(path.join(__dirname, "../src/inngest/functions/schedules/scheduler-runner.ts"));

    const eventsTypeAlias = clientSourceFile.getTypeAliasOrThrow("Events");
    const eventsTypeLiteral = eventsTypeAlias.getType().getApparentProperties();

    let cases = "";

    for (const property of eventsTypeLiteral) {
        const eventName = property.getName();
        if (!eventName.startsWith("app/schedule/")) {
            continue;
        }

        const eventDeclaration = property.getDeclarations()[0] as PropertySignature;
        const eventType = eventDeclaration.getTypeNodeOrThrow().getText();

        
        const sendEventId = `send-${eventName.replace(/[^a-zA-Z0-9]/g, "-")}`;

        let dataObject = "{}";

        if (eventType.startsWith("ScheduleEventPayload")) {
            dataObject = `{
                        user_id: schedule.userId as InternalUserId,
                        scheduleId: schedule.id,
                    }`; 
        }


        cases += `
            case "${eventName}":
                await step.sendEvent("${sendEventId}", {
                    name: "${eventName}",
                    user: event.user,
                    data: ${dataObject}
                });
                break;`;
    }

    const handleScheduleRequestVariable = schedulerRunnerSourceFile.getVariableDeclarationOrThrow("handleScheduleRequest");
    const switchStatement = handleScheduleRequestVariable.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

    const newSwitchStatement = `switch (schedule.eventName) {${cases}
            default:
                // We can't easily validate this at compile time.
                // TODO: Look into a way to enforce this.
                logger.error({ eventName: schedule.eventName }, "Unknown event name for schedule");
                throw new Error(\`Unknown event \${schedule.eventName}\`);
        }`;

    switchStatement.replaceWithText(newSwitchStatement);

    await schedulerRunnerSourceFile.save();

    console.log("Successfully updated the scheduler-runner.ts file!");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
