import {createAgent, gemini} from "@inngest/agent-kit";

export const searchAgent = createAgent({
    name: 'Search',
    system: 'You are a search agent',
    description: 'Search the web for information',
    model: gemini({model: 'gemini-2.5-flash'}),

});

export const summaryAgent = createAgent({
    name: 'Summary',
    system: 'You are a summary agent',
    description: 'Summarize the information',
    model: gemini({model: 'gemini-2.5-flash'}),
});
