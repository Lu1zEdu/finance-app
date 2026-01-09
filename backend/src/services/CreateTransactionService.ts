import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTransactionRequest {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    accountId: string;
    categoryId?: string;
    isTaxable?: boolean;
    taxRate?: number;
}

export class CreateTransactionService {
    async execute({
        description, amount, type, accountId, categoryId, isTaxable, taxRate
    }: CreateTransactionRequest) {

        // 1. Verifica se a conta existe
        const account = await prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error("Conta não encontrada!");
        }

        // 2. Define o valor líquido para o cálculo do saldo
        // (Se for Despesa, inverte o sinal para subtrair)
        // Nota: O banco guarda o valor absoluto na transação, mas o saldo da conta sobe ou desce

        // UMA TRANSAÇÃO ATÔMICA (Tudo ou nada)
        // Se der erro ao atualizar o saldo, ele não cria a transação
        const result = await prisma.$transaction(async (prisma) => {

            // Cria a transação
            const transaction = await prisma.transaction.create({
                data: {
                    description,
                    amount,
                    type,
                    accountId,
                    categoryId,
                    isTaxable: isTaxable || false,
                    taxRate: taxRate || 0,
                    date: new Date(),
                },
            });

            // Atualiza o saldo da conta
            const operation = type === 'INCOME' ? 'increment' : 'decrement';

            await prisma.account.update({
                where: { id: accountId },
                data: {
                    balance: {
                        [operation]: amount
                    }
                }
            });

            return transaction;
        });

        return result;
    }
}