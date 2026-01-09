import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionController {

    // Criar nova transação
    async create(req: Request, res: Response) {
        try {
            const { description, amount, type, accountId, isTaxable, taxRate } = req.body;

            // Validação básica
            if (!description || !amount || !type) {
                return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
            }

            // Converte para float para garantir
            const value = parseFloat(amount);

            // Cria no banco
            const transaction = await prisma.transaction.create({
                data: {
                    description,
                    amount: value,
                    type, // 'INCOME' ou 'EXPENSE'
                    date: new Date(), // Data de hoje
                    accountId: accountId || null, // Pode ser null por enquanto
                    isTaxable: isTaxable || false,
                    taxRate: taxRate || 0,
                },
            });

            return res.status(201).json(transaction);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar transação' });
        }
    }

    // Listar todas
    async index(req: Request, res: Response) {
        try {
            const transactions = await prisma.transaction.findMany({
                orderBy: { date: 'desc' } // Mais recentes primeiro
            });
            return res.json(transactions);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar transações' });
        }
    }
}