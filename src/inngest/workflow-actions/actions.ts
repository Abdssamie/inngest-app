import { type EngineAction, type PublicEngineAction } from "@inngest/workflow-kit";

import { actionsDefinition } from "../actions-definition";



export const engineActions: EngineAction[] = [
{
    // Add a Table of Contents
    ...actionsDefinition[0],
    handler: async ({ event, step, workflow, workflowAction, state }) => {
        // ...
    }
},
];