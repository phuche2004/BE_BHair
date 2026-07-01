import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class ExplorerController {
    private getBasePath() {
        return path.join(process.env.HOME || '/data/data/com.termux/files/home', 'storage', 'shared', 'phuc_data');
    }

    private getSafePath(reqPath: string) {
        const base = this.getBasePath();
        // Prevent directory traversal
        const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        return path.join(base, safePath);
    }

    renderExplorer = async (req: Request, res: Response) => {
        try {
            const currentPath = (req.query.path as string) || '/';
            const fullPath = this.getSafePath(currentPath);

            // Ensure base dir exists
            if (!fs.existsSync(this.getBasePath())) {
                fs.mkdirSync(this.getBasePath(), { recursive: true });
            }

            if (!fs.existsSync(fullPath)) {
                return res.redirect('/explorer');
            }

            const items = fs.readdirSync(fullPath, { withFileTypes: true });
            const files = items.map(item => {
                const stats = fs.statSync(path.join(fullPath, item.name));
                return {
                    name: item.name,
                    isDirectory: item.isDirectory(),
                    size: stats.size,
                    modifiedAt: stats.mtime
                };
            }).sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            // Parent path calculation for the "Up" button
            let parentPath = '/';
            if (currentPath !== '/') {
                parentPath = path.dirname(currentPath);
                if (parentPath === '.') parentPath = '/';
            }

            res.render('explorer', {
                files,
                currentPath,
                parentPath,
                user: req.user
            });
        } catch (error: any) {
            res.status(500).send(`Lỗi hệ thống: ${error.message}`);
        }
    };

    uploadFile = async (req: Request, res: Response) => {
        try {
            const currentPath = (req.body.currentPath as string) || '/';
            if (req.file) {
                const targetDir = this.getSafePath(currentPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                const finalPath = path.join(targetDir, req.file.originalname);
                fs.renameSync(req.file.path, finalPath);
            }
            res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
        } catch (error: any) {
            res.status(500).send(`Upload thất bại: ${error.message}`);
        }
    };

    createFolder = async (req: Request, res: Response) => {
        try {
            const currentPath = (req.body.currentPath as string) || '/';
            const folderName = req.body.folderName as string;
            
            if (folderName) {
                const targetDir = path.join(this.getSafePath(currentPath), folderName);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir);
                }
            }
            res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
        } catch (error: any) {
            res.status(500).send(`Tạo thư mục thất bại: ${error.message}`);
        }
    };

    deleteItem = async (req: Request, res: Response) => {
        try {
            const currentPath = (req.body.currentPath as string) || '/';
            const itemName = req.body.itemName as string;
            
            if (itemName) {
                const targetPath = path.join(this.getSafePath(currentPath), itemName);
                if (fs.existsSync(targetPath)) {
                    const stats = fs.statSync(targetPath);
                    if (stats.isDirectory()) {
                        fs.rmSync(targetPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(targetPath);
                    }
                }
            }
            res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
        } catch (error: any) {
            res.status(500).send(`Xóa thất bại: ${error.message}`);
        }
    };

    downloadFile = async (req: Request, res: Response) => {
        try {
            const filePath = (req.query.file as string);
            if (!filePath) return res.status(400).send('No file specified');
            
            const targetPath = this.getSafePath(filePath);
            if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
                res.download(targetPath);
            } else {
                res.status(404).send('File không tồn tại');
            }
        } catch (error: any) {
            res.status(500).send(`Tải file thất bại: ${error.message}`);
        }
    };
}
