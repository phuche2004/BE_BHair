import express, { Request, Response, NextFunction } from 'express';
import { ExplorerController } from '../controllers/explorer.controller';
import multer from 'multer';
import os from 'os';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';

const upload = multer({ dest: os.tmpdir() });

const router = express.Router();
const controller = new ExplorerController();

// Custom Web Auth Middleware for Explorer
// This automatically redirects to /explorer/login instead of returning JSON error
const requireWebAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.redirect('/explorer/login');
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        // Cho phép MANAGER hoặc ADMIN
        if (decoded.role !== UserRole.MANAGER && decoded.role !== UserRole.ADMIN) {
            return res.status(403).send('Forbidden: Bạn không có quyền truy cập thư mục này.');
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/explorer/login');
    }
};

// Auth Routes (Public)
router.get('/login', controller.renderLogin);
router.post('/login', controller.handleLogin);
router.get('/logout', controller.handleLogout);

// Apply Web Auth Middleware to protect the following routes
router.use(requireWebAuth);

// Render UI
router.get('/', controller.renderExplorer);

// Actions
router.post('/upload', upload.single('file'), controller.uploadFile);
router.post('/mkdir', controller.createFolder);
router.post('/delete', controller.deleteItem);
router.get('/download', controller.downloadFile);

export default router;
