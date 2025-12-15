import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Management API',
            version: '1.0.0',
            description: 'API für Event Management System',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Event: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Event ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Event title'
                        },
                        description: {
                            type: 'string',
                            description: 'Event description'
                        },
                        location: {
                            type: 'string',
                            description: 'Event location'
                        },
                        startDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Event start date'
                        },
                        endDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Event end date'
                        },
                        registrationDeadline: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Registration deadline'
                        },
                        participants: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Participant'
                            }
                        }
                    }
                },
                Participant: {
                    type: 'object',
                    properties: {
                        firstName: {
                            type: 'string',
                            description: 'First name'
                        },
                        lastName: {
                            type: 'string',
                            description: 'Last name'
                        },
                        email: {
                            type: 'string',
                            description: 'Email address'
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/**/*.js', './controllers/**/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs;