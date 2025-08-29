import { createTool, Tool } from "@inngest/agent-kit";
import { z } from "zod";
import {NetworkState} from "@/services/state";


export const analyzeSensorTool = createTool({
  name: "analyze_sensor_data",
  description: "Analyze sensor readings and provide recommended actions.",
  parameters: z.object({
    turbidity: z.number(),
    ph: z.number(),
    flowRate: z.number(),
  }) as any,
  handler: async ({ turbidity, ph, flowRate }, { network }: Tool.Options<NetworkState>) => {
    // Simple rules for prototype
    let recommendation = "All sensors normal.";
    if (turbidity > 5) recommendation = "Increase filtration and monitor turbidity.";
    if (ph < 6.5 || ph > 8.5) recommendation += " Adjust chemical dosing for pH.";
    if (flowRate < 50) recommendation += " Check pump operation.";

    network.state.data.recommendation = recommendation;
  },
});


