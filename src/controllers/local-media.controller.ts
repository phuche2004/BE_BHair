import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { localMediaDir } from '../utils/multer.local';

const getCleanPath = (inputPath: any): string => {
    if (typeof inputPath !== 'string') return '';
    // Prevent directory traversal
    return inputPath.replace(/\.+[\\\/]/g, '').replace(/^\/+/g, '');
};

const getRelativeUrlPath = (folderPath: string, filename: string): string => {
    if (!folderPath) return `/${filename}`;
    // Replace windows backslashes with forward slashes for URLs
    return `/${folderPath}/${filename}`.replace(/\\/g, '/');
};

/**
 * Handle file upload (single or multiple)
 */
export const uploadFiles = (req: Request, res: Response): void => {
    try {
        const files = req.files as Express.Multer.File[];
        const folderPath = getCleanPath(req.query.path || req.body.path);
        
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'No files uploaded' });
            return;
        }

        const uploadedFiles = files.map(file => {
            const relPath = getRelativeUrlPath(folderPath, file.filename);
            return {
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                url: `/media${relPath}`,
                downloadUrl: `/api/v1/local-media/download?path=${encodeURIComponent(relPath)}`
            };
        });

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
 * List all files and folders in a specific directory
 */
export const listFiles = (req: Request, res: Response): void => {
    try {
        const folderPath = getCleanPath(req.query.path);
        const targetDir = path.join(localMediaDir, folderPath);

        if (!fs.existsSync(targetDir)) {
            res.status(404).json({ success: false, message: 'Directory not found' });
            return;
        }

        fs.readdir(targetDir, (err, items) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Could not read media directory' });
                return;
            }

            const itemList = items.map(item => {
                const itemPath = path.join(targetDir, item);
                const stats = fs.statSync(itemPath);
                const isDir = stats.isDirectory();
                const relPath = getRelativeUrlPath(folderPath, item);

                return {
                    filename: item,
                    isDir,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    url: isDir ? null : `/media${relPath}`,
                    downloadUrl: isDir ? null : `/api/v1/local-media/download?path=${encodeURIComponent(relPath)}`,
                    relativePath: relPath
                };
            }).sort((a, b) => {
                // Folders first, then by date descending
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            res.status(200).json({
                success: true,
                count: itemList.length,
                data: itemList,
                currentPath: folderPath
            });
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Download a specific file
 */
export const downloadFile = (req: Request, res: Response): void => {
    try {
        // We use query param instead of route param to easily support paths with slashes
        const filePathParam = req.query.path;
        if (!filePathParam || typeof filePathParam !== 'string') {
            res.status(400).json({ success: false, message: 'Path is required' });
            return;
        }

        const cleanPath = getCleanPath(filePathParam);
        const targetPath = path.join(localMediaDir, cleanPath);

        if (!fs.existsSync(targetPath)) {
            res.status(404).json({ success: false, message: 'File not found' });
            return;
        }

        const filename = path.basename(targetPath);

        res.download(targetPath, filename, (err) => {
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

/**
 * Create a new folder
 */
export const createFolder = (req: Request, res: Response): void => {
    try {
        const folderPath = getCleanPath(req.body.path);
        const folderName = getCleanPath(req.body.name);

        if (!folderName) {
            res.status(400).json({ success: false, message: 'Folder name is required' });
            return;
        }

        const targetDir = path.join(localMediaDir, folderPath, folderName);

        if (fs.existsSync(targetDir)) {
            res.status(400).json({ success: false, message: 'Folder already exists' });
            return;
        }

        fs.mkdirSync(targetDir, { recursive: true });

        res.status(201).json({ success: true, message: 'Folder created successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a file or folder
 */
export const deleteItem = (req: Request, res: Response): void => {
    try {
        const itemPath = getCleanPath(req.body.path);

        if (!itemPath) {
            res.status(400).json({ success: false, message: 'Path is required' });
            return;
        }

        const targetPath = path.join(localMediaDir, itemPath);

        if (!fs.existsSync(targetPath)) {
            res.status(404).json({ success: false, message: 'Item not found' });
            return;
        }

        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(targetPath);
        }

        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Rename a file or folder
 */
export const renameItem = (req: Request, res: Response): void => {
    try {
        const itemPath = getCleanPath(req.body.path);
        const newName = getCleanPath(req.body.newName);

        if (!itemPath || !newName) {
            res.status(400).json({ success: false, message: 'Path and newName are required' });
            return;
        }

        const oldPath = path.join(localMediaDir, itemPath);
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);

        if (!fs.existsSync(oldPath)) {
            res.status(404).json({ success: false, message: 'Item not found' });
            return;
        }

        if (fs.existsSync(newPath)) {
            res.status(400).json({ success: false, message: 'Target name already exists' });
            return;
        }

        fs.renameSync(oldPath, newPath);

        res.status(200).json({ success: true, message: 'Renamed successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
