import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parse } from 'node-ofx-parser';
import fs from 'fs';

const prisma = new PrismaClient();

export class ImportController {

    async importOFX(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const { userId, accountId } = req.body;

        try {
            const ofxData = fs.readFileSync(req.file.path, 'utf8');
            const data = parse(ofxData);

            const transactions = data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
            const list = Array.isArray(transactions) ? transactions : [transactions];

            let count = 0;

            for (const t of list) {
                const rawDate = t.DTPOSTED.substring(0, 8);
                const year = rawDate.substring(0, 4);
                const month = rawDate.substring(4, 6);
                const day = rawDate.substring(6, 8);
                const dateISO = new Date(`${year}-${month}-${day}`);

                const amount = parseFloat(t.TRNAMT);
                const type = amount >= 0 ? 'INCOME' : 'EXPENSE';

                const exists = await prisma.transaction.findFirst({
                    where: {
                        accountId,
                        amount: Math.abs(amount),
                        date: dateISO,
                        description: t.MEMO || t.NAME
                    }
                });

                if (!exists) {
                    await prisma.transaction.create({
                        data: {
                            accountId,
                            description: t.MEMO || t.NAME || 'Transação OFX',
                            amount: Math.abs(amount),
                            type,
                            date: dateISO,
                            necessity: 'Não classificado'
                        }
                    });

                    const op = type === 'INCOME' ? 'increment' : 'decrement';
                    await prisma.account.update({
                        where: { id: accountId },
                        data: { balance: { [op]: Math.abs(amount) } }
                    });

                    count++;
                }
            }

            fs.unlinkSync(req.file.path);

            return res.json({ message: `Processamento concluído. ${count} novas transações importadas.` });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Erro ao processar arquivo OFX.' });
        }
    }
}