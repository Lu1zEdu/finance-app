import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { UserController } from '../controllers/UserController';
import { PrismaClient } from '@prisma/client';

const router = Router();
const transactionController = new TransactionController();
const userController = new UserController();
const prisma = new PrismaClient();

// --- ROTAS DE USUÁRIO ---
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);

// --- ROTAS DE TRANSAÇÕES ---
router.get('/transactions', transactionController.index);
router.post('/transactions', transactionController.create);

// --- SEED (Utilitário) ---
router.post('/seed', async (req, res) => {
    try {
        await prisma.category.createMany({
            data: [
                { name: 'Alimentação', type: 'EXPENSE' },
                { name: 'Moradia', type: 'EXPENSE' },
                { name: 'Salário', type: 'INCOME' },
            ],
            skipDuplicates: true,
        });
        res.json({ message: 'Categorias criadas!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro no seed' });
    }
});

export { router };