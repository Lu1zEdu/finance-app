import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TaxController {

    // Simula: "Quero receber 1000 limpo. Quanto cobro na nota?"
    async simulate(req: Request, res: Response) {
        const { netAmount, taxRate } = req.body; // netAmount = Líquido, taxRate = 0.15 (15%)

        if (!netAmount || !taxRate) {
            return res.status(400).json({ error: 'Informe netAmount e taxRate' });
        }

        const net = parseFloat(netAmount);
        const rate = parseFloat(taxRate);

        // Fórmula: Bruto = Líquido / (1 - Taxa)
        const grossAmount = net / (1 - rate);
        const taxAmount = grossAmount - net;

        return res.json({
            netAmount: net,
            taxRate: rate,
            requiredGrossAmount: parseFloat(grossAmount.toFixed(2)), // Valor da Nota
            taxToPay: parseFloat(taxAmount.toFixed(2)) // Quanto vai pro governo
        });
    }

    // Relatório: Quanto de imposto gerado este mês?
    async getMonthTax(req: Request, res: Response) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Soma todas as transações tributáveis do mês
        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: firstDay,
                    lte: lastDay
                },
                isTaxable: true,
                type: 'INCOME'
            }
        });

        // Calcula o total
        let totalTax = 0;
        let totalGross = 0;

        transactions.forEach(t => {
            if (t.grossAmount && t.amount) {
                totalGross += Number(t.grossAmount);
                totalTax += (Number(t.grossAmount) - Number(t.amount));
            }
        });

        return res.json({
            month: now.getMonth() + 1,
            totalTaxGenerated: totalTax.toFixed(2),
            totalInvoiced: totalGross.toFixed(2) // Total emitido em notas
        });
    }
}