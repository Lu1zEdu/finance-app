import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
    async getSummary(req: Request, res: Response) {
        const userId = req.query.userId ? String(req.query.userId) : undefined;

        if (!userId) return res.status(400).json({ error: "UserId necessario" });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: true, goals: true }
        });

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const totalBalance = user.accounts.reduce((acc, account) => acc + Number(account.balance), 0);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentExpenses = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                account: { userId },
                type: 'EXPENSE',
                date: { gte: threeMonthsAgo }
            }
        });

        const totalSpentLast3Months = Number(recentExpenses._sum.amount || 0);
        const averageMonthlyExpense = totalSpentLast3Months / 3;

        const runway = averageMonthlyExpense > 0
            ? (totalBalance / averageMonthlyExpense).toFixed(1)
            : "Infinito";

        return res.json({
            userName: user.firstName,
            totalBalance,
            averageMonthlyExpense: averageMonthlyExpense.toFixed(2),
            financialRunway: `${runway} meses de liberdade`,
            goals: user.goals
        });
    }
}