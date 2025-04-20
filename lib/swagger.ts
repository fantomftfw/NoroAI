
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ADHD-Hero', // Updated Title
            version: '1.0.0',
            description: 'API documentation ADHD-Hero',
        },
        // Optional: Define servers, security schemes, etc.
        // servers: [ ... ]
    },
    // *** IMPORTANT: Update this path for App Router ***
    // Look for files named route.js or route.ts within app/api subdirectories
    apis: [
        'app/api/**/route.ts'  // For TypeScript
    ],
};

export const openapiSpecification = swaggerJsdoc(options);