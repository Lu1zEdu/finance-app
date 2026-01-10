import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTransactionRequest {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    accountId?: string;
    creditCardId?: string;
    categoryId?: string;
    necessity?: string;
    isTaxable?: boolean;
    taxRate?: number;
}

export class CreateTransactionService {
    async execute({
        description, amount, type, accountId, creditCardId, categoryId, necessity, isTaxable, taxRate
    }: CreateTransactionRequest) {

        let finalGrossAmount = null;
        let finalAmount = amount;

        if (type === 'INCOME' && isTaxable && taxRate) {
            finalGrossAmount = amount / (1 - taxRate);
        }

        const result = await prisma.$transaction(async (prisma) => {

            const transaction = await prisma.transaction.create({
                data: {
                    description,
                    amount: finalAmount,
                    type,
                    accountId,
                    creditCardId,
                    categoryId,
                    necessity: necessity || "Não classificado",
                    isTaxable: isTaxable || false,
                    taxRate: taxRate || 0,
                    grossAmount: finalGrossAmount || 0,
                    date: new Date(),
                },
            });

            if (accountId) {
                const operation = type === 'INCOME' ? 'increment' : 'decrement';
                await prisma.account.update({
                    where: { id: accountId },
                    data: {
                        balance: { [operation]: finalAmount }
                    }
                });
            }

            return transaction;
        });

        return result;
    }
}