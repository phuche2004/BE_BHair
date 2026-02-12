import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with IUser interface if available and imported
        }
    }
}

class AuthMiddleware {
    verifyToken = (req: Request, res: Response, next: NextFunction) => {
        try {
            // Prioritize Header (typical for API clients)
            let token = req.headers.authorization;

            // Allow cookie as fallback if needed, but primary is Header
            if (!token && req.cookies && req.cookies.token) {
                token = req.cookies.token;
            }

            if (!token) {
                return res.status(401).json({ message: "Access denied. No token provided." });
            }

            if (token.startsWith("Bearer ")) {
                token = token.slice(7, token.length).trimLeft();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            req.user = decoded;

            next();
        } catch (error: any) {
            return res.status(401).json({
                message: "Invalid or expired token.",
                error: error.message
            });
        }
    }

    // New middleware for public pages (soft check) - Optional for pure API but kept for compatibility
    attachUser = (req: Request, res: Response, next: NextFunction) => {
        try {
            let token = req.headers.authorization || (req.cookies && req.cookies.token);
            if (token) {
                if (token.startsWith("Bearer ")) {
                    token = token.slice(7, token.length).trimLeft();
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
                req.user = decoded;
            }
        } catch (error) {
            // Ignore invalid token for public pages
        }
        next();
    }

    verifyRole = (roles: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.user || !roles.includes(req.user.role)) {
                return res.status(403).json({
                    message: "Forbidden: You do not have permission to access this resource."
                });
            }
            next();
        }
    }
}

export default new AuthMiddleware();

