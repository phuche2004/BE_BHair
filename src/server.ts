import dotenv from 'dotenv';
dotenv.config({ quiet: true } as any);

import express, { Application, Request, Response } from 'express';
import connectDB from './config/database';
import { verifyCloudinaryConnection } from './config/cloudinary.config';
import morgan from 'morgan';
import cors from 'cors';

// Connect to database
connectDB();
// Verify Cloudinary
verifyCloudinaryConnection();

const app: Application = express();
const PORT = process.env.PORT || 1000;

// Routes
import authRoutes from './routes/auth.route';
import shopRoutes from './routes/shop.route';
import serviceRoutes from './routes/service.route';
import appointmentRoutes from './routes/appointment.route';
import searchRoutes from './routes/search.route';
import reviewRoutes from './routes/review.route';
import notificationRoutes from './routes/notification.route';
import slotRoutes from './routes/slot.route';
import aiRoutes from './routes/ai.route';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Log HTTP requests
}

// Route registrations
app.use('/api/v1/user', authRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/service', serviceRoutes);
app.use('/api/v1/appointment', appointmentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1', slotRoutes); // Mount at root /api/v1 because route already has /shop prefix

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

// CI/CD Webhook cho Termux Android
import { execSync } from 'child_process';
app.post('/api/deploy', (req: Request, res: Response): void => {
    if (req.headers['x-deploy-secret'] !== (process.env.DEPLOY_SECRET || 'chuoi-bi-mat-cua-tao')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        console.log('Nhan duoc lenh deploy. Dang pull code...');
        execSync('git pull origin main && npm run build && pm2 restart BE_BHair', { cwd: process.cwd() });
        res.json({ status: 'deployed' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
import { createServer } from 'http';
import { initSocket } from './utils/socket';

const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const HOST = '0.0.0.0';

httpServer.listen(PORT as number, HOST, () => {
    console.log(`\x1b[32m\x1b[1m✓ B_Hair API\x1b[0m  http://192.168.110.117:${PORT}`);
});

export default app;
