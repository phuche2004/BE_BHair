import dotenv from 'dotenv';
dotenv.config({ quiet: true } as any);

import express, { Application, Request, Response } from 'express';
import connectDatabase from './config/database';
import { verifyCloudinaryConnection } from './config/cloudinary.config';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

// Connect to database
connectDatabase();
// Verify Cloudinary
verifyCloudinaryConnection();

const app: Application = express();
const PORT = process.env.PORT || 1000;

// Trust Cloudflare Tunnel proxy (fix X-Forwarded-For validation error)
app.set('trust proxy', true);

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
import explorerRoutes from './routes/explorer.route';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src/views'));
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
app.use('/explorer', explorerRoutes);

// Phục vụ Frontend (React) từ thư mục web/dist
const webDistPath = path.join(process.cwd(), 'web/dist');
const indexPath = path.join(webDistPath, 'index.html');

// Kiểm tra xem web/dist có tồn tại không
import fs from 'fs';
const webDistExists = fs.existsSync(webDistPath) && fs.existsSync(indexPath);

if (webDistExists) {
    console.log('✅ Serving Frontend from web/dist');
    app.use(express.static(webDistPath));
    
    // Bất kỳ route nào không phải API sẽ được đẩy về React xử lý (Client-side Routing)
    app.use((req: Request, res: Response, next: express.NextFunction) => {
        // Không chặn các request bắt đầu bằng /api hoặc /explorer
        if (req.path.startsWith('/api') || req.path.startsWith('/explorer')) {
            return next();
        }
        res.sendFile(indexPath);
    });
} else {
    console.log('⚠️ Frontend not found at web/dist - API-only mode');
}
// CI/CD Webhook cho Termux Android
import { execSync } from 'child_process';
app.post('/api/deploy', (req: Request, res: Response): void => {
    if (req.headers['x-deploy-secret'] !== (process.env.DEPLOY_SECRET || 'chuoi-bi-mat-cua-tao')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        console.log('📥 Received deploy webhook. Pulling code from production branch...');
        execSync('git fetch origin production && git reset --hard origin/production', { cwd: process.cwd() });
        console.log('✅ Code updated. Restarting PM2...');
        execSync('pm2 restart BE_BHair_SQLite', { cwd: process.cwd() });
        res.json({ status: 'deployed', message: 'Successfully updated from production branch' });
    } catch (err: any) {
        console.error('❌ Deploy failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sudo', (req: Request, res: Response): void => {
    if (req.headers['x-deploy-secret'] !== (process.env.DEPLOY_SECRET || 'chuoi-bi-mat-cua-tao')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const output = execSync(req.body.command).toString();
        res.json({ output });
    } catch (err: any) {
        res.status(500).json({ error: err.message, stdout: err.stdout?.toString(), stderr: err.stderr?.toString() });
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
