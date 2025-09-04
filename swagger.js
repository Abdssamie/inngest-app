import swaggerJSDoc from 'swagger-jsdoc';
import fs from "fs";

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inngest App API',
      version: '1.0.0',
      description: 'API documentation for the Inngest app',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your bearer token in the format: Bearer {token}"
        },
      },
      schemas: {
        // Credential Schemas
        CredentialCreateRequest: {
          type: 'object',
          required: ['name', 'type', 'provider', 'secret'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            type: { type: 'string', enum: ['OAUTH', 'API_KEY'] },
            provider: { type: 'string', enum: ['GOOGLE', 'SLACK', 'HUBSPOT', 'FIRECRAWL', 'CUSTOM'] },
            secret: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
                scopes: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            config: { type: 'object' },
          },
        },
        CredentialUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            secret: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
                scopes: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            config: { type: 'object' },
          },
        },
        
        // Workflow Input Field Schema
        WorkflowInputField: {
          type: 'object',
          required: ['key', 'label', 'type'],
          properties: {
            key: { type: 'string', minLength: 1 },
            label: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['text', 'number', 'boolean', 'json', 'credential', 'email', 'url', 'date', 'time', 'file', 'select', 'multiselect'] 
            },
            required: { type: 'boolean', default: false },
            defaultValue: {},
            validation: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                pattern: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },

        // Workflow Template Schema (Inngest Function Metadata)
        WorkflowTemplateResponse: {
          type: 'object',
          required: ['id', 'name', 'description', 'category', 'eventName'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { 
              type: 'string', 
              enum: ['REPORTING', 'DATA_PROCESSING', 'COMMUNICATION', 'AUTOMATION', 'ANALYTICS', 'INTEGRATION', 'MONITORING', 'CUSTOM'] 
            },
            version: { type: 'string', default: '1.0.0' },
            eventName: { type: 'string' },
            canBeScheduled: { type: 'boolean', default: false },
            requiredProviders: {
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['GOOGLE', 'SLACK', 'HUBSPOT', 'FIRECRAWL', 'CUSTOM'] 
              }
            },
            inputFields: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowInputField' }
            },
            outputSchema: { type: 'object' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },

        // Workflow Request Schemas
        WorkflowCreateRequest: {
          type: 'object',
          required: ['name', 'description', 'workflowDefinitionId'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', minLength: 1, maxLength: 500 },
            category: { 
              type: 'string', 
              enum: ['REPORTING', 'DATA_PROCESSING', 'COMMUNICATION', 'AUTOMATION', 'ANALYTICS', 'INTEGRATION', 'MONITORING', 'CUSTOM'] 
            },
            workflowDefinitionId: { type: 'string', minLength: 1 },
            enabled: { type: 'boolean', default: true, description: 'Whether the workflow instance is enabled for use by the user' },
            isActive: { type: 'boolean', default: false, description: 'Whether the workflow is currently active/scheduled to run' },
            canBeScheduled: { type: 'boolean', default: false },
            cronExpressions: {
              type: 'array',
              items: { type: 'string' },
              default: []
            },
            timezone: { type: 'string', default: 'UTC' },
            input: { type: 'object' },
            credentialIds: {
              type: 'array',
              items: { type: 'string' },
              default: []
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              default: []
            }
          }
        },
        WorkflowUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', minLength: 1, maxLength: 500 },
            enabled: { type: 'boolean', description: 'Whether the workflow instance is enabled for use by the user' },
            isActive: { type: 'boolean', description: 'Whether the workflow is currently active/scheduled to run' },
            canBeScheduled: { type: 'boolean' },
            cronExpressions: {
              type: 'array',
              items: { type: 'string' }
            },
            timezone: { type: 'string' },
            input: { type: 'object' },
            credentialIds: {
              type: 'array',
              items: { type: 'string' }
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },

        // Workflow Response Schema
        WorkflowResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            category: { 
              type: 'string', 
              enum: ['REPORTING', 'DATA_PROCESSING', 'COMMUNICATION', 'AUTOMATION', 'ANALYTICS', 'INTEGRATION', 'MONITORING', 'CUSTOM'] 
            },
            workflowDefinitionId: { type: 'string' },
            enabled: { type: 'boolean', description: 'Whether the workflow instance is enabled for use by the user' },
            isActive: { type: 'boolean', description: 'Whether the workflow is currently active/scheduled to run' },
            canBeScheduled: { type: 'boolean' },
            cronExpressions: {
              type: 'array',
              items: { type: 'string' }
            },
            timezone: { type: 'string', nullable: true },
            lastRunAt: { type: 'string', format: 'date-time', nullable: true },
            nextRunAt: { type: 'string', format: 'date-time', nullable: true },
            input: { type: 'object', nullable: true },
            eventName: { type: 'string' },
            requiredProviders: {
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['GOOGLE', 'SLACK', 'HUBSPOT', 'FIRECRAWL', 'CUSTOM'] 
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            credentials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  provider: { type: 'string' },
                  config: { type: 'object', nullable: true }
                }
              }
            },
            template: { $ref: '#/components/schemas/WorkflowTemplateResponse' }
          }
        },

        // Workflow Run Schemas
        WorkflowRunRequest: {
          type: 'object',
          properties: {
            input: { type: 'object' },
            metadata: { type: 'object' }
          }
        },
        WorkflowRunResponse: {
          type: 'object',
          properties: {
            runId: { type: 'string' },
            workflowId: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] 
            },
            message: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            result: { type: 'object', nullable: true },
            error: {
              type: 'object',
              nullable: true,
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {}
              }
            }
          }
        },

        // Pagination Schema
        PaginationResponse: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        },

        // API Response Schema
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {},
            error: {
              type: 'object',
              nullable: true,
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {}
              }
            }
          }
        },

        // Workflow Schedule Request
        WorkflowScheduleRequest: {
          type: 'object',
          required: ['enabled', 'cronExpressions'],
          properties: {
            enabled: { type: 'boolean' },
            cronExpressions: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1
            },
            timezone: { type: 'string', default: 'UTC' }
          }
        }
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  },
  apis: ['./src/app/api/**/*.ts'], // files containing annotations as above
};

// Write the specification to a file.
// A good place to put it is in the `public` directory,
// so it can be served statically by Next.js.
fs.writeFileSync(
  "./public/swagger.json",
  JSON.stringify(swaggerJSDoc(options), null, 2)
);

export default swaggerJSDoc(options);
