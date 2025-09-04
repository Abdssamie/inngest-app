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
