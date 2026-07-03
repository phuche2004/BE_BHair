"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthMiddleware {
    constructor() {
        this.verifyToken = (req, res, next) => {
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
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                next();
            }
            catch (error) {
                return res.status(401).json({
                    message: "Invalid or expired token.",
                    error: error.message
                });
            }
        };
        // New middleware for public pages (soft check) - Optional for pure API but kept for compatibility
        this.attachUser = (req, res, next) => {
            try {
                let token = req.headers.authorization || (req.cookies && req.cookies.token);
                if (token) {
                    if (token.startsWith("Bearer ")) {
                        token = token.slice(7, token.length).trimLeft();
                    }
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    req.user = decoded;
                }
            }
            catch (error) {
                // Ignore invalid token for public pages
            }
            next();
        };
        this.verifyRole = (roles) => {
            return (req, res, next) => {
                if (!req.user || !roles.includes(req.user.role)) {
                    return res.status(403).json({
                        message: "Forbidden: You do not have permission to access this resource."
                    });
                }
                next();
            };
        };
    }
}
exports.default = new AuthMiddleware();
