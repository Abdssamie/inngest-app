import { Provider } from "@prisma/client";

// Simple workflow metadata - just what you need
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  eventName: string;
  canBeScheduled: boolean;
  requiredProviders: Provider[];
  category: string;
  isDefault: boolean; // auto-installed for new users
}

// Your actual workflow templates
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  "daily-report": {
    id: "daily-report",
    name: "Generate Daily Report",
    description: "Automatically generate and send daily reports from Google Sheets data",
    eventName: "workflow/report.requested",
    canBeScheduled: true,
    requiredProviders: [Provider.GOOGLE],
    category: "REPORTING",
    isDefault: true,
  },
  // Add more as needed
};

// Simple helper functions
export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES[id];
}

export function getAllWorkflowTemplates(): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES);
}

export function getDefaultWorkflowTemplates(): WorkflowTemplate[] {
  return getAllWorkflowTemplates().filter(template => template.isDefault);
}

export function getMarketplaceWorkflowTemplates(): WorkflowTemplate[] {
  return getAllWorkflowTemplates().filter(template => !template.isDefault);
}
