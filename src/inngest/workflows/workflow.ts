import { Engine } from "@inngest/workflow-kit";

import { inngest } from "../client";
import { engineActions as actions } from "@/inngest/workflow-actions/actions";
import { loadWorkflowInstanceFromEvent } from "../loaders";

const workflowEngine = new Engine({
  actions: actions,
  // loader: loadWorkflowInstanceFromEvent
  }
);

export default inngest.createFunction(
  { id: "blog-post-workflow" },
  { event: "blog-post.updated" },
  async ({ event, step, prisma }) => {
    // When `run` is called,
    //  the loader function is called with access to the event
    await workflowEngine.run({ event, step });
  }
);