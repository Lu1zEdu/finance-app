import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express'; // Importa a UI
import { router } from './routes/index';
import { swaggerSpec } from './swagger';    // Importa a config que criamos

const app = express();

app.use(express.json());
app.use(cors());

// Rota da Documentação (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});