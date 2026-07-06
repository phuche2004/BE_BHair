"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.updateFcmToken = exports.getProfile = exports.login = exports.register = void 0;
const user_model_1 = __importStar(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client();
// Helper to generate Token
const generateToken = (user) => {
    var _a;
    return jsonwebtoken_1.default.sign({ id: user.id, role: user.role, fullName: user.fullName, shopId: (_a = user.shopId) !== null && _a !== void 0 ? _a : null }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, phoneNumber, password, role } = req.body;
        // Validate phone number format (only digits, 10-11 characters)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number format. Must be 10-11 digits.' });
        }
        // Check user exists
        const existingUser = user_model_1.default.findByPhoneNumber(phoneNumber);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this phone number.' });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Handle Avatar Upload
        let avatarUrl = '';
        if (req.file && req.file.path) {
            avatarUrl = req.file.path; // Cloudinary URL automatically returned by multer-storage-cloudinary
        }
        // Resolve registration role
        let userRole = user_model_1.UserRole.CUSTOMER;
        if (role === 'MANAGER') {
            userRole = user_model_1.UserRole.MANAGER;
        }
        else if (role === 'STAFF' || role === 'BARBER') {
            userRole = user_model_1.UserRole.STAFF;
        }
        const newUser = user_model_1.default.create({
            fullName,
            phoneNumber,
            password: hashedPassword,
            role: userRole,
            avatar: avatarUrl
        });
        const token = generateToken(newUser);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                avatar: newUser.avatar
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, password } = req.body;
        const user = user_model_1.default.findByPhoneNumber(phoneNumber);
        if (!user || !user.password) {
            // Handle case where password might be missing (e.g. social login but we don't have that yet)
            return res.status(400).json({ message: 'Invalid phone number or password' });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid phone number or password' });
        }
        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                avatar: user.avatar,
                shopId: user.shopId
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.login = login;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // req.user is set by authMiddleware
        const user = user_model_1.default.findByIdWithoutPassword(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getProfile = getProfile;
const updateFcmToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken)
            return res.status(400).json({ message: 'fcmToken is required' });
        user_model_1.default.findByIdAndUpdate(req.user.id, { fcmToken });
        res.json({ message: 'FCM Token updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateFcmToken = updateFcmToken;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'ID Token is required' });
        }
        const audiences = [
            process.env.GOOGLE_CLIENT_ID_ANDROID,
            process.env.GOOGLE_CLIENT_ID_WEB,
            process.env.GOOGLE_CLIENT_ID_IOS
        ].filter(Boolean);
        console.log('Verifying token with audiences:', audiences);
        if (audiences.length === 0) {
            console.error('CRITICAL: No Google Client IDs configured on server!');
        }
        // Verify Google ID Token
        const ticket = yield client.verifyIdToken({
            idToken: idToken,
            audience: audiences,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ message: 'Invalid ID Token payload' });
        }
        const { sub, email, name, picture } = payload;
        // Find user by googleId or email
        let user = user_model_1.default.findOne({
            googleId: sub
        }) || user_model_1.default.findOne({
            email: email
        });
        if (user) {
            // Update existing user if googleId is missing or if info changed
            const updates = {};
            if (!user.googleId)
                updates.googleId = sub;
            if (!user.email && email)
                updates.email = email;
            if (Object.keys(updates).length > 0) {
                user = user_model_1.default.findByIdAndUpdate(user.id, updates);
            }
        }
        else {
            // Create new user
            user = user_model_1.default.create({
                fullName: name || 'Google User',
                email: email || '',
                googleId: sub,
                avatar: picture || '',
                role: user_model_1.UserRole.CUSTOMER,
                isActive: true
            });
        }
        const token = generateToken(user);
        res.status(200).json({
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                shopId: user.shopId
            }
        });
    }
    catch (error) {
        console.error('Google Login Verification Error:', error.message);
        // Phân loại lỗi để trả về thông báo hữu ích hơn
        let message = 'Xác thực Google thất bại';
        let httpStatus = 401;
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('no registered origin')) {
            message = 'Lỗi cấu hình Google OAuth: Origin chưa được đăng ký trong Google Cloud Console. ' +
                'Vào Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web) → ' +
                'Authorized JavaScript origins → thêm origin của bạn (VD: http://localhost:5173)';
            httpStatus = 400;
        }
        else if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('invalid_client')) {
            message = 'Lỗi cấu hình Google OAuth: Client ID không hợp lệ hoặc chưa được đăng ký đúng origin/redirect URI';
            httpStatus = 400;
        }
        else if (((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('Wrong number of segments')) || ((_d = error.message) === null || _d === void 0 ? void 0 : _d.includes('Invalid token'))) {
            message = 'ID Token không hợp lệ hoặc đã hết hạn';
        }
        res.status(httpStatus).json({
            message,
            error: error.message,
            debug: {
                configuredAudiences: {
                    ANDROID: !!process.env.GOOGLE_CLIENT_ID_ANDROID,
                    WEB: !!process.env.GOOGLE_CLIENT_ID_WEB,
                    IOS: !!process.env.GOOGLE_CLIENT_ID_IOS
                }
            }
        });
    }
});
exports.googleLogin = googleLogin;
