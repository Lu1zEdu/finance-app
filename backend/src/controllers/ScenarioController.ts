import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ScenarioController {

    // Criar um Cenário com Itens
    async create(req: Request, res: Response) {
        const { title, description, userId, items } = req.body;
        // items = [{ description: "Aluguel", amount: 2000, type: "EXPENSE", frequency: "MONTHLY" }]

        const scenario = await prisma.scenario.create({
            data: {
                title,
                description,
                userId,
                items: {
                    create: items // Cria os itens junto
                }
            },
            include: { items: true }
        });

        return res.status(201).json(scenario);
    }

    // Ativar Cenário (Transforma em Contas Recorrentes Reais)
    async activate(req: Request, res: Response) {
        const { id } = req.params; // ID do Cenário

        const scenario = await prisma.scenario.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!scenario) return res.status(404).json({ error: 'Cenário não encontrado' });

        // Copia os itens do cenário para a tabela de Recorrência (Calendário Real)
        const recurringData = scenario.items.map(item => ({
            description: item.description,
            amount: item.amount,
            type: item.type,
            frequency: item.frequency,
            userId: scenario.userId,
            startDate: new Date(),
            nextDueDate: new Date() // Começa hoje
        }));

        await prisma.recurringTransaction.createMany({
            data: recurringData
        });

        // Marca cenário como ativo
        await prisma.scenario.update({
            where: { id },
            data: { isActive: true }
        });

        return res.json({ message: `Cenário '${scenario.title}' ativado! Contas adicionadas ao calendário.` });
    }

    // Listar Recorrências (O Calendário)
    async listRecurring(req: Request, res: Response) {
        // Aqui pegaria o ID do usuário logado
        // Simplificando pegando todos ou por query param
        const list = await prisma.recurringTransaction.findMany({
            where: { active: true }
        });
        return res.json(list);
    }
}