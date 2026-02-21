export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Adirai Connect API',
    version: '0.1.0',
  },
  servers: [{ url: 'http://localhost:4000/api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register user',
        responses: {
          '201': { description: 'Created' },
        },
      },
    },
  },
};

