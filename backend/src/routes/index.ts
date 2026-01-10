import { Router } from 'express';
import multer from 'multer';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

// Controllers
import { UserController } from '../controllers/UserController';
import { TransactionController } from '../controllers/TransactionController';
import { AccountController } from '../controllers/AccountController';
import { WorkController } from '../controllers/WorkController';
import { WorkHistoryController } from '../controllers/WorkHistoryController';
import { ScenarioController } from '../controllers/ScenarioController';
import { GoalController } from '../controllers/GoalController';
import { DashboardController } from '../controllers/DashboardController';
import { GoogleCalendarController } from '../controllers/GoogleCalendarController';
import { ImportController } from '../controllers/ImportController';
import { BudgetController } from '../controllers/BudgetController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Pasta temporária para uploads
const prisma = new PrismaClient(); // Apenas para o Seed

// Instâncias
const userController = new UserController();
const transactionController = new TransactionController();
const accountController = new AccountController();
const workController = new WorkController();
const workHistoryController = new WorkHistoryController();
const scenarioController = new ScenarioController();
const goalController = new GoalController();
const dashboardController = new DashboardController();
const googleCalendarController = new GoogleCalendarController();
const importController = new ImportController();
const budgetController = new BudgetController();

// --- AUTH GOOGLE ---
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.json({ message: "Logado com Google!", user: req.user });
});

// --- USUÁRIOS ---
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/profile/:id', userController.getProfile);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);

// --- CONTAS ---
router.get('/accounts', accountController.index);
router.post('/accounts', accountController.create);
router.put('/accounts/:id', accountController.update);
router.patch('/accounts/:id/archive', accountController.archive);
router.delete('/accounts/:id', accountController.delete);

// --- TRANSAÇÕES & IMPORTAÇÃO ---
router.get('/transactions', transactionController.index);
router.post('/transactions', transactionController.create);
router.post('/transactions/import', upload.single('file'), importController.importOFX); // <--- Upload OFX

// --- METAS ---
router.get('/goals', goalController.index);
router.post('/goals', goalController.create);
router.put('/goals/:id', goalController.update);
router.delete('/goals/:id', goalController.delete);
router.post('/goals/:id/deposit', goalController.deposit);
router.post('/goals/:id/withdraw', goalController.withdraw);

// --- ORÇAMENTOS (BUDGETS) ---
router.post('/budgets', budgetController.setBudget);
router.get('/budgets/status', budgetController.getStatus);

// --- TRABALHO & HISTÓRICO ---
router.post('/work/clt', workController.simulateCLT);
router.post('/work/project', workController.calculateProject);
router.get('/work/history', workHistoryController.index);
router.post('/work/history', workHistoryController.create);
router.put('/work/history/:id', workHistoryController.update);
router.patch('/work/history/:id/leave', workHistoryController.leaveJob);
router.delete('/work/history/:id', workHistoryController.delete);
router.get('/work/freelance-timeline', workHistoryController.getFreelanceTimeline);

// --- CENÁRIOS & CALENDÁRIO ---
router.post('/scenarios', scenarioController.create);
router.post('/scenarios/activate/:id', scenarioController.activate);
router.get('/scenarios/calendar', scenarioController.listRecurring);
router.post('/calendar/add', googleCalendarController.addReminder); // Google Calendar

// --- DASHBOARD ---
router.get('/dashboard/summary', dashboardController.getSummary);

// --- UTILITÁRIOS (SEED) ---
router.post('/seed', async (req, res) => {
    try {
        await prisma.category.createMany({
            data: [
                { name: 'Alimentação', type: 'EXPENSE' },
                { name: 'Moradia', type: 'EXPENSE' },
                { name: 'Lazer', type: 'EXPENSE' },
                { name: 'Transporte', type: 'EXPENSE' },
                { name: 'Saúde', type: 'EXPENSE' },
                { name: 'Educação', type: 'EXPENSE' },
                { name: 'Salário', type: 'INCOME' },
                { name: 'Freelance', type: 'INCOME' },
                { name: 'Investimentos', type: 'INCOME' },
            ],
            skipDuplicates: true,
        });
        res.json({ message: 'Categorias criadas!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro no seed' });
    }
});

export { router };