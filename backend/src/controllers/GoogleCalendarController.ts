import { Request, Response } from 'express';
import { google } from 'googleapis';

export class GoogleCalendarController {

    // Adicionar Lembrete de Pagamento
    async addReminder(req: Request, res: Response) {
        // O Token vem da sessão do usuário logado via Google
        const user = req.user as any;
        const { title, date } = req.body; // Ex: "Pagar Aluguel", "2024-12-25"

        if (!user || !user.googleAccessToken) {
            return res.status(401).json({ error: 'Usuário não conectado ao Google' });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: user.googleAccessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        try {
            await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: `💰 FinanceApp: ${title}`,
                    description: 'Lembrete gerado automaticamente pelo seu app financeiro.',
                    start: { date: date }, // Evento de dia inteiro
                    end: { date: date },
                }
            });

            return res.json({ message: 'Evento adicionado ao Google Calendar!' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar evento no Google.' });
        }
    }
}