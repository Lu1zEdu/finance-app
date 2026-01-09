import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { PrismaClient } from '@prisma/client';

const router = Router();
const transactionController = new TransactionController();

// Rotas de Transações
router.post('/transactions', transactionController.create); // Criar
router.get('/transactions', transactionController.index);   // Listar

export { router };


// Rota utilitária para criar categorias iniciais
router.post('/seed', async (req, res) => {
    const prisma = new PrismaClient(); // Importe o PrismaClient no topo se precisar

    try {
        // Cria Categorias Padrão
        await prisma.category.createMany({
            data: [
                { name: 'Alimentação', type: 'EXPENSE' },
                { name: 'Moradia', type: 'EXPENSE' },
                { name: 'Transporte', type: 'EXPENSE' },
                { name: 'Lazer', type: 'EXPENSE' },
                { name: 'Salário/Freelance', type: 'INCOME' },
                { name: 'Investimentos', type: 'INCOME' },
            ],
            skipDuplicates: true, // Se já existir, ignora
        });

        res.json({ message: 'Categorias criadas com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar seed' });
    }
});