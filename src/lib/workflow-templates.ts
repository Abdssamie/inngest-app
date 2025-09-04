import {z} from "zod";
import {Provider} from "@prisma/client";

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    eventName: string;
    canBeScheduled: boolean;
    requiredProviders: Provider[];
    requiredScopes: Partial<Record<Provider, string[]>>;
    inputSchema: z.ZodSchema<any>; // Each workflow defines its own validation
    type: 'marketplace' | 'custom'; // All templates are now marketplace (free or paid) or custom
    restrictedToUsers?: string[]; // For custom workflows - which users can see this
    pricing: {
        type: 'free' | 'paid';
        price?: number; // Price in cents (e.g., 999 = $9.99)
        currency?: 'USD' | 'EUR' | 'GBP'; // Default to USD
        billingPeriod?: 'one_time' | 'monthly' | 'yearly'; // Default to one_time
    };
    category?: string;
    tags?: string[];
    featured?: boolean; // For highlighting popular workflows
    author?: string; // Who created this template
    version?: string; // Template version
}

// Input schemas for each workflow
export const DailyReportInputSchema = z.object({
    reportTitle: z.string().min(1, "Report title is required"),
    sheetName: z.string().min(1, "Sheet name is required"),
    emailRecipients: z.array(z.email()).min(1, "At least one recipient required"),
    reportFormat: z.enum(["PDF", "CSV", "XLSX"]).default("PDF"),
    includeCharts: z.boolean().default(true),
});

export const EmailNotificationInputSchema = z.object({
    recipientEmails: z.array(z.email()).min(1, "At least one recipient required"),
    subject: z.string().min(1, "Subject is required"),
    template: z.enum(["simple", "detailed", "custom"]).default("simple"),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const DataSyncInputSchema = z.object({
    sourceSheetId: z.string().min(1, "Source sheet ID is required"),
    targetSheetId: z.string().min(1, "Target sheet ID is required"),
    syncColumns: z.array(z.string()).min(1, "At least one column to sync required"),
    overwriteExisting: z.boolean().default(false),
});

export const SlackNotificationInputSchema = z.object({
    channelId: z.string().min(1, "Channel ID is required"),
    message: z.string().min(1, "Message is required"),
    includeMentions: z.boolean().default(false),
    mentionUsers: z.array(z.string()).optional(),
});

// Add more input schemas as you build more workflows...

// Your workflow templates
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
    "daily-report": {
        id: "daily-report",
        name: "Generate Daily Report",
        description: "Automatically generate and send daily reports from Google Sheets data",
        eventName: "workflow/report.requested",
        canBeScheduled: true,
        requiredProviders: [Provider.GOOGLE],
        requiredScopes: {
            GOOGLE: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/gmail.send"],
        },
        inputSchema: DailyReportInputSchema,
        type: 'marketplace',
        pricing: {
            type: 'free',
        },
        category: 'Reporting',
        tags: ['google-sheets', 'email', 'automation', 'reports'],
        featured: true,
        author: 'Inngest Team',
        version: '1.0.0',
    },
    "email-notification": {
        id: "email-notification",
        name: "Smart Email Notifications",
        description: "Send intelligent email notifications based on triggers with customizable templates",
        eventName: "workflow/email.notification",
        canBeScheduled: true,
        requiredProviders: [Provider.GOOGLE],
        requiredScopes: {
            GOOGLE: ["https://www.googleapis.com/auth/gmail.send"],
        },
        inputSchema: EmailNotificationInputSchema,
        type: 'marketplace',
        pricing: {
            type: 'free',
        },
        category: 'Communication',
        tags: ['email', 'notifications', 'automation'],
        featured: false,
        author: 'Inngest Team',
        version: '1.0.0',
    },
    "advanced-data-sync": {
        id: "advanced-data-sync",
        name: "Advanced Data Synchronization",
        description: "Powerful bi-directional data sync between multiple Google Sheets with conflict resolution",
        eventName: "workflow/data.sync.advanced",
        canBeScheduled: true,
        requiredProviders: [Provider.GOOGLE],
        requiredScopes: {
            GOOGLE: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/spreadsheets"],
        },
        inputSchema: DataSyncInputSchema,
        type: 'marketplace',
        pricing: {
            type: 'paid',
            price: 1999, // $19.99
            currency: 'USD',
            billingPeriod: 'monthly',
        },
        category: 'Data Management',
        tags: ['google-sheets', 'sync', 'data-management', 'premium'],
        featured: true,
        author: 'Inngest Team',
        version: '2.1.0',
    },
    "slack-integration-pro": {
        id: "slack-integration-pro",
        name: "Slack Integration Pro",
        description: "Advanced Slack integration with custom workflows, thread management, and analytics",
        eventName: "workflow/slack.integration.pro",
        canBeScheduled: true,
        requiredProviders: [Provider.SLACK, Provider.GOOGLE],
        requiredScopes: {
            GOOGLE: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/spreadsheets"],
            SLACK: ["chat:write", "chat:write.public"],
        },
        inputSchema: SlackNotificationInputSchema,
        type: 'marketplace',
        pricing: {
            type: 'paid',
            price: 2999, // $29.99
            currency: 'USD',
            billingPeriod: 'monthly',
        },
        category: 'Communication',
        tags: ['slack', 'integration', 'analytics', 'premium'],
        featured: true,
        author: 'Inngest Team',
        version: '1.5.0',
    },
    "basic-scheduler": {
        id: "basic-scheduler",
        name: "Basic Task Scheduler",
        description: "Simple scheduling system for basic automation tasks",
        eventName: "workflow/scheduler.basic",
        canBeScheduled: true,
        requiredProviders: [],
        requiredScopes: {},
        inputSchema: z.object({
            taskName: z.string().min(1, "Task name is required"),
            description: z.string().optional(),
        }),
        type: 'marketplace',
        pricing: {
            type: 'free',
        },
        category: 'Automation',
        tags: ['scheduler', 'basic', 'automation'],
        featured: false,
        author: 'Community',
        version: '1.0.0',
    },
    // Add more templates as you build them...
};

// Helper functions
export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES[id];
}

export function getAvailableTemplatesForUser(userId: string): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template => {
        if (template.type === 'marketplace') {
            return true; // Available to all users (free or paid)
        }
        if (template.type === 'custom') {
            return template.restrictedToUsers?.includes(userId) || false;
        }
        return false;
    });
}

// New helper functions for pricing
export function getFreeTemplates(): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template =>
        template.type === 'marketplace' && template.pricing.type === 'free'
    );
}

export function getPaidTemplates(): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template =>
        template.type === 'marketplace' && template.pricing.type === 'paid'
    );
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template =>
        template.category === category
    );
}

export function getTemplatesByProvider(provider: Provider): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template =>
        template.requiredProviders.includes(provider)
    );
}

export function getFeaturedTemplates(): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES).filter(template =>
        template.featured === true
    );
}

export function validateWorkflowInput(templateId: string, input: any): { valid: boolean; errors: string[] } {
    const template = getWorkflowTemplate(templateId);
    if (!template) {
        return {valid: false, errors: [`Template '${templateId}' not found`]};
    }

    try {
        template.inputSchema.parse(input);
        return {valid: true, errors: []};
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {valid: false, errors: error.issues.map(e => e.message)};
        }
        return {valid: false, errors: ['Invalid input']};
    }
}


/**
 * Defines the parameters for querying workflow templates.
 */
interface TemplateQueryFilters {
    userId: string;
    search?: string;
    provider?: string;
    pricing?: 'free' | 'paid';
    category?: string;
    featured?: boolean;
}

/**
 * Queries and filters workflow templates based on a set of criteria.
 *
 * @param filters An object containing the filtering parameters.
 * @returns A filtered array of WorkflowTemplate objects.
 */
export function queryWorkflowTemplates(filters: TemplateQueryFilters): WorkflowTemplate[] {
    const { userId, search, provider, pricing, category, featured } = filters;

    let templates = getAvailableTemplatesForUser(userId);

    // Apply search filter
    if (search) {
        const searchLower = search.toLowerCase();
        templates = templates.filter(template =>
            template.name.toLowerCase().includes(searchLower) ||
            template.description.toLowerCase().includes(searchLower) ||
            template.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
    }

    // Apply provider filter
    if (provider) {
        templates = templates.filter(template =>
            template.requiredProviders.map(p => p.toString()).includes(provider)
        );
    }

    // Apply pricing filter
    if (pricing) {
        templates = templates.filter(template =>
            template.pricing.type === pricing
        );
    }

    // Apply category filter
    if (category) {
        templates = templates.filter(template =>
            template.category === category
        );
    }

    // Apply featured filter
    if (featured) {
        templates = templates.filter(template =>
            template.featured === true
        );
    }

    return templates;
}

