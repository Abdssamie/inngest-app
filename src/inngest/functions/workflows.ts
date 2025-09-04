//  import workflows definitions from docs/workflows.json
import workflows from "./docs/workflows.json";
import prisma from "@/lib/prisma"
import {TriggerType, Workflow} from "@prisma/client";

// parse the properties of the workflows json file

export function createDefaultWorkflows(userId: InternalUserId) {
    try {
        prisma.workflow.createMany({
            data: workflows.map((workflow) => {
                return {
                    id: workflow.id,
                    name: workflow.name,
                    description: workflow.description,
                    triggerType: workflow.trigger_type as TriggerType,
                    trigger: workflow.trigger,
                    userId: userId,
                };
            }),
        });
    } catch (error) {
        throw new Error('Error creating default workflows:', error);
    }
}
