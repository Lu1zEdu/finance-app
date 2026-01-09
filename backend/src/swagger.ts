import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance App API',
            version: '1.0.0',
            description: 'Documentação da API do Sistema Financeiro Pessoal',
            contact: {
                name: 'Seu Nome',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor Local',
            },
        ],
        components: {
            schemas: {
                Transaction: {
                    type: 'object',
                    properties: {
                        description: { type: 'string' },
                        amount: { type: 'number' },
                        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                        accountId: { type: 'string' }
                    }
                }
            }
        }
    },
    // Onde ele vai procurar as rotas para documentar
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);