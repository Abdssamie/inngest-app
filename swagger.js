import swaggerJSDoc from 'swagger-jsdoc';

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
        url: 'http://localhost:3000',
      },
    ],
    components: {
      schemas: {
        CredentialCreateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            credential: {
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
            credential: {
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
          },
        },
        WorkflowCreateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            enabled: { type: 'boolean' },
            trigger: { type: 'string' },
            credentials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  credentialId: { type: 'string' },
                },
              },
            },
          },
        },
        WorkflowUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            enabled: { type: 'boolean' },
            trigger: { type: 'string' },
            credentials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  credentialId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // files containing annotations as above
};

export default swaggerJSDoc(options);
