import express from 'express';
import { ExplorerController } from '../controllers/explorer.controller';
import authMiddleware from '../middlewares/auth.middleware';
import multer from 'multer';
import os from 'os';

// Setup multer to temporarily store files in OS temp dir before moving them to the destination
const upload = multer({ dest: os.tmpdir() });

const router = express.Router();
const controller = new ExplorerController();

// Apply auth middleware to protect the route.
// Because this is a page navigation (SSR), the token will come from cookies.
// The auth middleware in B_Hair falls back to cookies automatically.
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.verifyRole(['admin'])); // Only admins can access

// Render UI
router.get('/', controller.renderExplorer);

// Actions
router.post('/upload', upload.single('file'), controller.uploadFile);
router.post('/mkdir', controller.createFolder);
router.post('/delete', controller.deleteItem);
router.get('/download', controller.downloadFile);

export default router;
