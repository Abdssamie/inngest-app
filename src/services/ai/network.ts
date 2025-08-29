import { createNetwork } from '@inngest/agent-kit';
import {waterOpsAgent} from "@/services/agents/water-ops-agent";


const network = createNetwork({
    name: "main network",
    agents: [ waterOpsAgent ],
    router: ({lastResult, callCount}) => {
        // retrieve the last message from the output
        const lastMessage = lastResult?.output[lastResult?.output.length - 1];

        // First call: use the water ops agent
        if (callCount === 0) {
            return waterOpsAgent;
        }
        // Otherwise, we're done!
        return undefined;
    },
});

// Run the network with a user prompt
await network.run('How is this water quality? pH 7.5, turbidity 5, flow rate 60');
