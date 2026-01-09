import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const router = Router();
const transactionController = new TransactionController();

// Rotas de Transações
router.post('/transactions', transactionController.create); // Criar
router.get('/transactions', transactionController.index);   // Listar

export { router };