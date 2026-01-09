import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { UserController } from '../controllers/UserController';
import { PrismaClient } from '@prisma/client';

const router = Router();
const transactionController = new TransactionController();
const userController = new UserController();
const prisma = new PrismaClient();

// --- ROTAS DE USUÁRIO ---

/**
 * @swagger
 * /users/register:
 * post:
 * summary: Cria um novo usuário
 * tags: [Usuários]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * password:
 * type: string
 * avatarUrl:
 * type: string
 * responses:
 * 201:
 * description: Usuário criado com sucesso
 */
router.post('/users/register', userController.register);

/**
 * @swagger
 * /users/login:
 * post:
 * summary: Realiza login do usuário
 * tags: [Usuários]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 200:
 * description: Login realizado com sucesso
 */
router.post('/users/login', userController.login);

// --- ROTAS DE TRANSAÇÕES ---

/**
 * @swagger
 * /transactions:
 * get:
 * summary: Lista todas as transações
 * tags: [Transações]
 * responses:
 * 200:
 * description: Lista de transações
 */
router.get('/transactions', transactionController.index);

/**
 * @swagger
 * /transactions:
 * post:
 * summary: Cria uma nova transação
 * tags: [Transações]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Transaction'
 * responses:
 * 201:
 * description: Transação criada
 */
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