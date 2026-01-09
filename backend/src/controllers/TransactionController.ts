import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateTransactionService } from '../services/CreateTransactionService';

const prisma = new PrismaClient();

export class TransactionController {

    async create(req: Request, res: Response) {
        try {
            const { description, amount, type, accountId, categoryId, isTaxable, taxRate } = req.body;

            const createTransaction = new CreateTransactionService();

            const transaction = await createTransaction.execute({
                description,
                amount: parseFloat(amount),
                type,
                accountId,
                categoryId,
                isTaxable,
                taxRate
            });

            return res.status(201).json(transaction);

        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async index(req: Request, res: Response) {
        const transactions = await prisma.transaction.findMany({
            include: { category: true, account: true },
            orderBy: { date: 'desc' }
        });
        return res.json(transactions);
    }
}