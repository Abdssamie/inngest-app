import prisma from "@/lib/prisma";
import { getFreeTemplates } from "./workflow-templates";

/**
 * Install free marketplace workflows for a new user
 * Called when a user signs up - now installs all free templates instead of "default" ones
 */
export async function installDefaultWorkflowsForUser(userId: string) {
  const freeTemplates = getFreeTemplates();

  const workflowsToCreate = freeTemplates.map(template => ({
    userId,
    name: template.name,
    description: template.description,
    enabled: true, // User can use these workflows
    isActive: false, // Not scheduled by default
    canBeScheduled: template.canBeScheduled,
    cronExpressions: [],
    timezone: "UTC",
    input: null, // User will configure later
    eventName: template.eventName,
    requiredProviders: template.requiredProviders,
    config: {
      templateId: template.id,
      installedAt: new Date().toISOString(),
      type: 'marketplace',
      pricing: template.pricing,
      category: template.category,
      tags: template.tags,
      author: template.author,
      version: template.version,
    },
  }));

  try {
    await prisma.workflow.createMany({
      data: workflowsToCreate,
      skipDuplicates: true, // In case this is called multiple times
    });
    
    console.log(`Installed ${workflowsToCreate.length} free marketplace workflows for user ${userId}`);
  } catch (error) {
    console.error('Error installing free marketplace workflows:', error);
    throw error;
  }
}
