import {createAgent, gemini } from '@inngest/agent-kit';
import {analyzeSensorTool} from "@/services/ai/tools";


export const waterOpsAgent = createAgent({
    name: "Water Operations AI",
    description: "Provides guidance on water treatment and sensor anomalies.",
    system: "You are an expert water treatment operator and chemical engineer.",
    model: gemini({model: "gemini-2.5-flash"}),
    tools: [analyzeSensorTool],
});
