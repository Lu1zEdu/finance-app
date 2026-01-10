import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkHistoryController {

    // Adicionar um Trabalho (Entrou no emprego ou Pegou um freela)
    async create(req: Request, res: Response) {
        const { userId, type, role, company, startDate, salary, taxPaid } = req.body;

        const work = await prisma.workHistory.create({
            data: {
                userId,
                type, // "CLT" ou "FREELANCE"
                role,
                company,
                startDate: new Date(startDate),
                salary,
                taxPaid: taxPaid || 0,
                isCurrent: true
            }
        });
        return res.status(201).json(work);
    }

    // PUT: Atualizar dados (Recebeu aumento, mudou cargo)
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { role, company, salary, taxPaid, startDate, endDate } = req.body;

        const work = await prisma.workHistory.update({
            where: { id },
            data: {
                role, company, salary, taxPaid,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            }
        });
        return res.json(work);
    }

    // SAÍDA (Soft): Marcar que saiu do emprego (Booleano)
    async leaveJob(req: Request, res: Response) {
        const { id } = req.params;
        const { endDate } = req.body; // Data da saída

        const work = await prisma.workHistory.update({
            where: { id },
            data: {
                isCurrent: false,
                endDate: endDate ? new Date(endDate) : new Date()
            }
        });
        return res.json({ message: 'Histórico encerrado (Saída registrada)', work });
    }

    // DELETE (Hard): Apagar registro se errou
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.workHistory.delete({ where: { id } });
        return res.json({ message: 'Registro de trabalho apagado' });
    }

    // LINHA DO TEMPO: Freelancer
    async getFreelanceTimeline(req: Request, res: Response) {
        const { userId } = req.query;

        const jobs = await prisma.workHistory.findMany({
            where: { userId: String(userId), type: 'FREELANCE' },
            orderBy: { startDate: 'desc' }
        });

        // Cálculos Totais
        const totalEarned = jobs.reduce((acc, job) => acc + Number(job.salary), 0);
        const totalTax = jobs.reduce((acc, job) => acc + Number(job.taxPaid || 0), 0);

        return res.json({
            summary: {
                projectsCount: jobs.length,
                totalEarned,
                totalTaxPaid: totalTax,
                netIncome: totalEarned - totalTax
            },
            timeline: jobs
        });
    }

    // Lista Geral (CLT + Freela)
    async index(req: Request, res: Response) {
        const { userId } = req.query;
        const history = await prisma.workHistory.findMany({
            where: { userId: String(userId) },
            orderBy: { startDate: 'desc' }
        });
        return res.json(history);
    }
}