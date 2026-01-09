import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class UserController {

    // Cadastrar Usuário
    async register(req: Request, res: Response) {
        try {
            const { name, email, password, avatarUrl } = req.body;

            // Verifica se já existe
            const userExists = await prisma.user.findUnique({ where: { email } });
            if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado' });

            // Criptografa a senha
            const hashPassword = await bcrypt.hash(password, 8);

            // Cria usuário e já cria uma conta "Carteira" padrão pra ele
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashPassword,
                    avatarUrl: avatarUrl || 'https://github.com/shadcn.png', // Foto padrão se não enviar
                    accounts: {
                        create: { name: 'Minha Carteira', type: 'CASH' }
                    }
                },
                include: { accounts: true } // Retorna a conta criada
            });

            // Remove a senha do retorno por segurança
            const { password: _, ...userWithoutPassword } = user;

            return res.status(201).json(userWithoutPassword);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }

    // Login (Autenticação)
    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Email ou senha inválidos' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ error: 'Email ou senha inválidos' });

        // Gera o Token
        const token = jwt.sign({ id: user.id }, 'SEGREDO_SUPER_SECRETO', { expiresIn: '1d' });

        // Retorna dados do usuário e token
        const { password: _, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword, token });
    }
}