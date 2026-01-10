import { Request, Response } from 'express';

export class WorkController {
    calculateProject(arg0: string, calculateProject: any) {
        throw new Error('Method not implemented.');
    }

    // Simula Salário CLT (Calcula descontos aproximados 2024)
    async simulateCLT(req: Request, res: Response) {
        const { grossSalary } = req.body; // Salário Bruto
        if (!grossSalary) return res.status(400).json({ error: 'Informe o grossSalary' });

        const salary = Number(grossSalary);

        // 1. Cálculo INSS (Simplificado progressivo)
        let inss = 0;
        if (salary <= 1412) inss = salary * 0.075;
        else if (salary <= 2666.68) inss = (salary * 0.09) - 21.18;
        else if (salary <= 4000.03) inss = (salary * 0.12) - 101.18;
        else inss = (salary * 0.14) - 181.18;

        // Teto do INSS
        if (inss > 908.85) inss = 908.85;

        // 2. Base IRRF
        const baseIRRF = salary - inss;

        // 3. Cálculo IRRF (Simplificado)
        let irrf = 0;
        if (baseIRRF <= 2259.20) irrf = 0;
        else if (baseIRRF <= 2826.65) irrf = (baseIRRF * 0.075) - 169.44;
        else if (baseIRRF <= 3751.05) irrf = (baseIRRF * 0.15) - 381.44;
        else if (baseIRRF <= 4664.68) irrf = (baseIRRF * 0.225) - 662.77;
        else irrf = (baseIRRF * 0.275) - 896.00;

        const netSalary = salary - inss - irrf;

        return res.json({
            grossSalary: salary,
            discounts: {
                inss: Number(inss.toFixed(2)),
                irrf: Number(irrf.toFixed(2)),
                total: Number((inss + irrf).toFixed(2))
            },
            netSalary: Number(netSalary.toFixed(2))
        });
    }

    // Simula Freelancer (PJ)
    async simulateFreelance(req: Request, res: Response) {
        const { netDesired, taxRate, hasInvoice } = req.body;

        const net = Number(netDesired);
        let rate = Number(taxRate) || 0;


        const grossNeeded = net / (1 - rate);
        const taxValue = grossNeeded - net;

        return res.json({
            scenario: hasInvoice ? "Com Nota Fiscal" : "Informal/Sem Nota",
            netDesired: net,
            taxRateUsed: rate,
            invoiceValue: Number(grossNeeded.toFixed(2)),
            taxToPay: Number(taxValue.toFixed(2))
        });
    }
}