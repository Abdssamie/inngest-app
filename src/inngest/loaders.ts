import {Credential, PrismaClient, Workflow as DbWorkflow, WorkflowCredential} from "@prisma/client";
import {Workflow, WorkflowAction} from "@inngest/workflow-kit";
import {JsonValue} from "@prisma/client/runtime/library";
// @ts-ignore
import {WorkflowEdge} from "@inngest/workflow-kit/dist/types";
import {decryptCredential} from "@/services/encrypt-credentials";

// Initialize a single PrismaClient instance to avoid connection pooling issues.
const prisma = new PrismaClient();

// Define the structure for a loaded workflow, including its associated credentials.
export interface LoadedWorkflow {
    workflow: Workflow;
    credentials: Record<string, object>; // Keyed by credential type or name
}

// Utility function to convert JsonValue to Workflow
function convertJsonToWorkflow(json: JsonValue): Workflow {
    // Check if json is an object and not null
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new Error('Invalid JSON: Expected an object');
    }

    // Extract fields
    const {name, description, metadata, actions, edges} = json as Record<string, any>;

    // Validate actions
    if (!Array.isArray(actions)) {
        throw new Error('Invalid JSON: actions must be an array');
    }

    // Validate each action
    const validatedActions: WorkflowAction[] = actions.map((action, index) => {
        if (
            !action ||
            typeof action !== 'object' ||
            !('id' in action) ||
            !('type' in action)
        ) {
            throw new Error(`Invalid JSON: actions[${index}] must be a valid WorkflowAction object`);
        }
        return action as WorkflowAction;
    });

    // Validate each action
    const validatedEdges: WorkflowEdge[] = edges.map((edge : WorkflowEdge, index: number) => {
        if (
            !edge ||
            typeof edge !== 'object' ||
            !('from' in edge) ||
            !('to' in edge)
        ) {
            throw new Error(`Invalid JSON: edges[${index}] must be a valid WorkflowEdge object`);
        }
        return edge as WorkflowEdge;
    });

    // Construct the Workflow object
    const workflow: Workflow = {
        actions: validatedActions,
        edges: validatedEdges
    };

    // Assign optional fields if they exist and are of the correct type
    if (typeof name === 'string') {
        workflow.name = name;
    }
    if (typeof description === 'string') {
        workflow.description = description;
    }
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
        workflow.metadata = metadata as Record<string, any>;
    }

    return workflow;
}

export const loadWorkflowInstanceFromEvent = async (
    event: { name: string }
): Promise<LoadedWorkflow> => {

    // Use Prisma to find the single, unique workflow instance.
    // The `include` statements are crucial here, as they tell Prisma
    // to fetch the related actions and edges in the same database query.
    const dbWorkflow = await prisma.workflow.findFirst({
        where: {
            trigger: event.name,
        },
        include: {
            workflowCredentials: {
                include: {
                    credential: true, // Include the actual Credential object
                },
            },
        },
    }) as (DbWorkflow & { workflowCredentials: (WorkflowCredential & { credential: Credential })[] }) | null;

    if (!dbWorkflow || !dbWorkflow.workflow) {
        throw new Error(`Workflow with trigger '${event.name}' not found in the database.`);
    }

    const workflow = convertJsonToWorkflow(dbWorkflow.workflow);

    const decryptedCredentials: Record<string, object> = {};
    for (const wc of dbWorkflow.workflowCredentials) {
        try {
            decryptedCredentials[wc.credential.type] = decryptCredential(wc.credential.secret);
        } catch (error) {
            console.error(`Failed to decrypt credential for workflow ${dbWorkflow.id}, credential ${wc.credential.id}:`, error);
            // Depending on requirements, you might throw an error, skip, or log and continue.
        }
    }
    
    return { workflow, credentials: decryptedCredentials };
};
