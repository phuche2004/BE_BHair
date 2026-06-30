import { Router } from 'express';
import { localUpload } from '../utils/multer.local';
import { uploadFiles, listFiles, downloadFile } from '../controllers/local-media.controller';

const router = Router();

// Upload files (allows multiple files with field name 'files', or adjust if frontend uses 'file')
// Using .array('files', 10) allows up to 10 files at once
router.post('/upload', localUpload.array('files', 10), uploadFiles);

// Get list of uploaded files
router.get('/', listFiles);

// Download a specific file
router.get('/download/:filename', downloadFile);

export default router;
