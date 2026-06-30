import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { localMediaDir } from '../utils/multer.local';

/**
 * Handle file upload (single or multiple)
 */
export const uploadFiles = (req: Request, res: Response): void => {
    try {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'No files uploaded' });
            return;
        }

        const uploadedFiles = files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            // URL to view the file directly
            url: `/media/${file.filename}`,
            downloadUrl: `/api/v1/local-media/download/${file.filename}`
        }));

        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully to local storage',
            data: uploadedFiles
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * List all files in the local media directory
 */
export const listFiles = (req: Request, res: Response): void => {
    try {
        fs.readdir(localMediaDir, (err, files) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Could not read media directory' });
                return;
            }

            const fileList = files.map(filename => {
                const filePath = path.join(localMediaDir, filename);
                const stats = fs.statSync(filePath);
                
                return {
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    url: `/media/${filename}`,
                    downloadUrl: `/api/v1/local-media/download/${filename}`
                };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // newest first

            res.status(200).json({
                success: true,
                count: fileList.length,
                data: fileList
            });
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Download a specific file (forces browser to download instead of displaying)
 */
export const downloadFile = (req: Request, res: Response): void => {
    try {
        const filenameParam = req.params.filename;
        const filename = Array.isArray(filenameParam) ? filenameParam[0] : filenameParam;
        
        if (!filename || typeof filename !== 'string') {
            res.status(400).json({ success: false, message: 'Filename is required' });
            return;
        }

        // Prevent directory traversal attacks
        if (filename.includes('..') || filename.includes('/')) {
             res.status(400).json({ success: false, message: 'Invalid filename' });
             return;
        }

        const filePath = path.join(localMediaDir, filename);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'File not found' });
            return;
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file' });
                }
            }
        });
    } catch (error: any) {
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
