"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.listFiles = exports.uploadFiles = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_local_1 = require("../utils/multer.local");
/**
 * Handle file upload (single or multiple)
 */
const uploadFiles = (req, res) => {
    try {
        const files = req.files;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.uploadFiles = uploadFiles;
/**
 * List all files in the local media directory
 */
const listFiles = (req, res) => {
    try {
        fs_1.default.readdir(multer_local_1.localMediaDir, (err, files) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Could not read media directory' });
                return;
            }
            const fileList = files.map(filename => {
                const filePath = path_1.default.join(multer_local_1.localMediaDir, filename);
                const stats = fs_1.default.statSync(filePath);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.listFiles = listFiles;
/**
 * Download a specific file (forces browser to download instead of displaying)
 */
const downloadFile = (req, res) => {
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
        const filePath = path_1.default.join(multer_local_1.localMediaDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
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
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
exports.downloadFile = downloadFile;
