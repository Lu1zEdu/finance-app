import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HistoryController {

    // Resumo do Mês (Entradas vs Saídas)
    async getMonthlySummary(req: Request, res: Response) {
        const { month, year } = req.query;

        const date = new Date();
        const currentMonth = month ? Number(month) - 1 : date.getMonth();
        const currentYear = year ? Number(year) : date.getFullYear();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: firstDay, lte: lastDay }
            }
        });

        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        return res.json({
            period: `${currentMonth + 1}/${currentYear}`,
            totalIncome: income.toFixed(2),
            totalExpense: expense.toFixed(2),
            monthlyBalance: (income - expense).toFixed(2), // Resultado do mês (Positivo ou Negativo)
            transactionCount: transactions.length
        });
    }

    // Histórico Detalhado (Com filtros opcionais)
    async getHistory(req: Request, res: Response) {
        // Ex: /history?type=EXPENSE&limit=5
        const { type, limit } = req.query;

        const transactions = await prisma.transaction.findMany({
            where: {
                type: type ? String(type) : undefined
            },
            take: limit ? Number(limit) : undefined,
            orderBy: { date: 'desc' },
            include: {
                category: true,
                account: { select: { name: true } }, // Traz o nome da conta
                creditCard: { select: { bankName: true } } // Traz o nome do cartão
            }
        });

        return res.json(transactions);
    }
}