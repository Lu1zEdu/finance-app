import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BudgetController {

    // Definir Orçamento
    async setBudget(req: Request, res: Response) {
        const { userId, categoryId, month, year, amount } = req.body;

        // Upsert: Cria se não existe, Atualiza se já existe
        const budget = await prisma.budget.upsert({
            where: {
                userId_categoryId_month_year: { userId, categoryId, month, year }
            },
            update: { amount },
            create: { userId, categoryId, month, year, amount }
        });

        return res.json(budget);
    }

    // Verificar Status (Gasto vs Limite)
    async getStatus(req: Request, res: Response) {
        const { userId, month, year } = req.query;

        // 1. Busca todos os orçamentos desse mês
        const budgets = await prisma.budget.findMany({
            where: {
                userId: String(userId),
                month: Number(month),
                year: Number(year)
            },
            include: { category: true }
        });

        // 2. Calcula quanto já gastou em cada categoria
        const result = await Promise.all(budgets.map(async (b) => {
            // Soma transações dessa categoria no mês
            const expenses = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    userId: undefined, // Transações estão ligadas a contas, que ligam a user. 
                    // Melhor filtrar transações -> account -> user, ou confiar no categoryId se for global
                    categoryId: b.categoryId,
                    type: 'EXPENSE',
                    date: {
                        gte: new Date(b.year, b.month - 1, 1),
                        lte: new Date(b.year, b.month, 0)
                    },
                    account: { userId: String(userId) } // Garante que é do usuário
                }
            });

            const spent = Number(expenses._sum.amount || 0);
            const limit = Number(b.amount);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;

            return {
                category: b.category.name,
                limit,
                spent,
                remaining: limit - spent,
                percentage: percentage.toFixed(1) + '%',
                status: percentage > 100 ? 'ESTOURADO 🚨' : 'OK ✅'
            };
        }));

        return res.json(result);
    }
}