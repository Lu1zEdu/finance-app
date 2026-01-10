// backend/src/controllers/AccountController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AccountController {

    // Lista apenas as ATIVAS por padrão
    async index(req: Request, res: Response) {
        const { userId, showArchived } = req.query;

        const where: any = { userId: String(userId) };
        if (showArchived !== 'true') {
            where.isActive = true;
        }

        const accounts = await prisma.account.findMany({ where });
        return res.json(accounts);
    }

    async create(req: Request, res: Response) {
        const { name, type, userId, balance } = req.body;
        const account = await prisma.account.create({
            data: { name, type, userId, balance: balance || 0 }
        });
        return res.status(201).json(account);
    }

    // PUT: Atualiza Nome, Tipo ou Saldo
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, type, balance, isActive } = req.body;

        const account = await prisma.account.update({
            where: { id },
            data: { name, type, balance, isActive }
        });
        return res.json(account);
    }

    // DELETE (Hard): Apaga do banco
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await prisma.account.delete({ where: { id } });
            return res.json({ message: 'Conta deletada permanentemente' });
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao deletar (possui transações?)' });
        }
    }

    // PATCH: Soft Delete (Arquivar)
    async archive(req: Request, res: Response) {
        const { id } = req.params;
        const account = await prisma.account.update({
            where: { id },
            data: { isActive: false }
        });
        return res.json({ message: 'Conta arquivada', account });
    }
}