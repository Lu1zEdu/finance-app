import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export class GoalController {

    // Lista todas as metas com porcentagem de conclusão
    async index(req: Request, res: Response) {
        const { userId } = req.query;

        if (!userId) return res.status(400).json({ error: 'UserId obrigatório' });

        const goals = await prisma.goal.findMany({
            where: { userId: String(userId) }
        });

        const goalsWithProgress = goals.map(goal => {
            const saved = Number(goal.savedAmount);
            const target = Number(goal.targetAmount);

            // Evita divisão por zero
            const percentage = target > 0 ? (saved / target) * 100 : 0;

            return {
                ...goal,
                percentage: percentage.toFixed(1) + '%',
                isCompleted: saved >= target,
                remaining: (target - saved) > 0 ? (target - saved) : 0
            };
        });

        return res.json(goalsWithProgress);
    }

    // Cria uma nova meta
    async create(req: Request, res: Response) {
        const { name, targetAmount, userId, deadline } = req.body;

        try {
            const goal = await prisma.goal.create({
                data: {
                    name,
                    targetAmount,
                    userId,
                    deadline: deadline ? new Date(deadline) : null
                }
            });
            return res.status(201).json(goal);
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao criar meta' });
        }
    }

    // Depositar valor na meta (+ Envio de Email se completar)
    async deposit(req: Request, res: Response) {
        const { id } = req.params;
        const { amount } = req.body;

        try {
            // 1. Atualiza o valor (Incrementa) e busca dados do usuário
            const goal = await prisma.goal.update({
                where: { id },
                data: { savedAmount: { increment: Number(amount) } },
                include: { user: true } // Precisamos do e-mail do dono da meta
            });

            // 2. Verifica se a meta foi atingida (Saldo >= Alvo)
            if (Number(goal.savedAmount) >= Number(goal.targetAmount)) {

                console.log(`🎉 META '${goal.name}' ATINGIDA! Enviando e-mail...`);

                // --- CONFIGURAÇÃO DO EMAIL ---
                // Para funcionar, você precisa gerar uma "Senha de App" no Google.
                // Não use sua senha normal de login!

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'le6269199@gmail.com', // <--- COLOQUE SEU GMAIL
                        pass: 'LuizEdu1509.'     // <--- A SENHA DE 16 LETRAS GERADA
                    }
                });

                const mailOptions = {
                    from: 'Finance App <le6269199@gmail.com>',
                    to: goal.user.email,
                    subject: `🏆 PARABÉNS! Você conquistou: ${goal.name}`,
                    text: `Olá ${goal.user.firstName}!\n\n` +
                        `Que notícia incrível! Você acabou de atingir sua meta "${goal.name}".\n\n` +
                        `💰 Valor Acumulado: R$ ${goal.savedAmount}\n` +
                        `📅 Data da conquista: ${new Date().toLocaleDateString()}\n\n` +
                        `Continue assim e realize seus sonhos!\n\n` +
                        `Atenciosamente,\nFinance App`
                };

                // Envia o e-mail
                await transporter.sendMail(mailOptions);
                console.log('📧 E-mail enviado com sucesso!');

                return res.json({
                    ...goal,
                    message: "Depósito realizado e META ATINGIDA! E-mail de comemoração enviado."
                });
            }

            return res.json(goal);

        } catch (error) {
            console.log(error);
            return res.status(400).json({ error: "Erro ao depositar na meta" });
        }
    }

    // Sacar valor da meta
    async withdraw(req: Request, res: Response) {
        const { id } = req.params;
        const { amount } = req.body;

        try {
            const goal = await prisma.goal.update({
                where: { id },
                data: { savedAmount: { decrement: Number(amount) } }
            });
            return res.json(goal);
        } catch (error) {
            return res.status(400).json({ error: "Erro ao sacar da meta" });
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, targetAmount, deadline } = req.body;

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                name,
                targetAmount,
                deadline: deadline ? new Date(deadline) : undefined
            }
        });
        return res.json(goal);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.goal.delete({ where: { id } });
        return res.json({ message: 'Meta removida com sucesso' });
    }
}