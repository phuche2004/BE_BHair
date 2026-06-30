import { Router } from 'express';
import { localUpload } from '../utils/multer.local';
import { uploadFiles, listFiles, downloadFile, createFolder, deleteItem, renameItem } from '../controllers/local-media.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// Only ADMIN can access cloud storage
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.verifyRole(['ADMIN']));

// Upload files (allows multiple files with 'media' field name)
router.post('/upload', localUpload.array('media', 10), uploadFiles);

// List files and folders
router.get('/', listFiles);

// Download specific file
router.get('/download', downloadFile);

// Create a new folder
router.post('/folder', createFolder);

// Delete file or folder
router.delete('/', deleteItem);

// Rename file or folder
router.put('/rename', renameItem);

export default router;
