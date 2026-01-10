import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class UserController {

    // --- CADASTRO ---
    async register(req: Request, res: Response) {
        try {
            const { firstName, lastName, email, password, avatarUrl, freelanceHourlyRate } = req.body;

            const userExists = await prisma.user.findUnique({ where: { email } });
            if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado' });

            const hashPassword = await bcrypt.hash(password, 8);

            // Cria Usuário + Conta Bancária Padrão + Carteira Física (Cofre em Casa)
            const user = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashPassword,
                    avatarUrl: avatarUrl || '',
                    birthDate: birthDate ? new Date(birthDate) : null,
                    freelanceHourlyRate: freelanceHourlyRate || 0,
                    accounts: {
                        create: [
                            { name: 'Conta Principal', type: 'CHECKING' },
                            { name: 'Dinheiro em Casa', type: 'CASH' } // <-- Sua "Carteira Física"
                        ]
                    }
                },
                include: { accounts: true }
            });

            const { password: _, ...userWithoutPassword } = user;
            return res.status(201).json(userWithoutPassword);

        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }

    // --- LOGIN ---
    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        // Verifica se existe e se NÃO foi deletado (Soft Delete)
        if (!user || user.isDeleted) {
            return res.status(400).json({ error: 'Usuário não encontrado ou desativado.' });
        }

        // Se o usuário foi criado via Google e não tem senha
        if (!user.password) {
            return res.status(400).json({ error: 'Faça login com Google.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id }, 'SECRET_KEY_MUDE_ISSO', { expiresIn: '1d' });

        const { password: _, ...userData } = user;
        return res.json({ user: userData, token });
    }

    // --- ATUALIZAR (PUT) ---
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const {
            firstName,
            lastName,
            email,
            avatarUrl,
            freelanceHourlyRate,
            cltBenefits, // Agora pode ser uma lista de objetos: [{"name": "VR", "amount": 500}]
            workExpenses
        } = req.body;

        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    firstName,
                    lastName,
                    email,
                    avatarUrl,
                    freelanceHourlyRate,
                    birthDate: birthDate ? new Date(birthDate) : undefined, // Atualiza se vier
                    cltBenefits: cltBenefits || undefined, // Atualiza o JSON
                    workExpenses
                }
            });

            const { password: _, ...userNoPass } = user;
            return res.json(userNoPass);
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao atualizar usuário' });
        }
    }

    // --- SOFT DELETE ---
    async delete(req: Request, res: Response) {
        const { id } = req.params;

        try {
            // Em vez de .delete(), fazemos .update()
            await prisma.user.update({
                where: { id },
                data: { isDeleted: true }
            });

            return res.json({ message: 'Conta desativada com sucesso. Entre em contato para restaurar.' });
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao desativar conta' });
        }
    }

    // --- BUSCAR DADOS (GET) ---
    async getProfile(req: Request, res: Response) {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: { accounts: true, creditCards: true } // Traz contas e cartões
        });

        if (!user || user.isDeleted) return res.status(404).json({ error: 'Usuário não encontrado' });

        const { password: _, ...userNoPass } = user;
        return res.json(userNoPass);
    }
}