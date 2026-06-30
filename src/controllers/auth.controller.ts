import { Request, Response } from 'express';
import User, { UserRole } from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

// Helper to generate Token
const generateToken = (user: any) => {
    return jwt.sign(
        { id: user._id, role: user.role, fullName: user.fullName, shopId: user.shopId ?? null },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    );
};

export const register = async (req: Request, res: Response) => {
    try {
        const { fullName, phoneNumber, password, role } = req.body;

        // Validate phone number format (only digits, 10-11 characters)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number format. Must be 10-11 digits.' });
        }

        // Check user exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this phone number.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Handle Avatar Upload
        let avatarUrl = '';
        if (req.file && req.file.path) {
            avatarUrl = req.file.path; // Cloudinary URL automatically returned by multer-storage-cloudinary
        }

        // Resolve registration role
        let userRole = UserRole.CUSTOMER;
        if (role === 'MANAGER') {
            userRole = UserRole.MANAGER;
        } else if (role === 'STAFF' || role === 'BARBER') {
            userRole = UserRole.STAFF;
        }

        const newUser = new User({
            fullName,
            phoneNumber,
            password: hashedPassword,
            role: userRole,
            avatar: avatarUrl
        });

        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                avatar: newUser.avatar
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, password } = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user || user.password === undefined) {
            // Handle case where password might be missing (e.g. social login but we don't have that yet)
            return res.status(400).json({ message: 'Invalid phone number or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid phone number or password' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                avatar: user.avatar,
                shopId: user.shopId
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        // req.user is set by authMiddleware
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateFcmToken = async (req: Request, res: Response) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) return res.status(400).json({ message: 'fcmToken is required' });

        await User.findByIdAndUpdate(req.user.id, { fcmToken });

        res.json({ message: 'FCM Token updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'ID Token is required' });
        }

        const audiences = [
            process.env.GOOGLE_CLIENT_ID_ANDROID,
            process.env.GOOGLE_CLIENT_ID_WEB,
            process.env.GOOGLE_CLIENT_ID_IOS
        ].filter(Boolean) as string[];

        console.log('Verifying token with audiences:', audiences);

        if (audiences.length === 0) {
            console.error('CRITICAL: No Google Client IDs configured on server!');
        }

        // Verify Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: audiences,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ message: 'Invalid ID Token payload' });
        }

        const { sub, email, name, picture } = payload;

        // Find user by googleId or email
        let user = await User.findOne({ 
            $or: [
                { googleId: sub },
                { email: email }
            ]
        });

        if (user) {
            // Update existing user if googleId is missing or if info changed
            let updated = false;
            if (!user.googleId) {
                user.googleId = sub;
                updated = true;
            }
            if (!user.email && email) {
                user.email = email;
                updated = true;
            }
            if (updated) await user.save();
        } else {
            // Create new user
            user = new User({
                fullName: name || 'Google User',
                email: email || '',
                googleId: sub,
                avatar: picture || '',
                role: UserRole.CUSTOMER,
                isActive: true
            });
            await user.save();
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Google login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                shopId: user.shopId
            }
        });

    } catch (error: any) {
        console.error('Google Login Verification Error:', error.message);

        // Phân loại lỗi để trả về thông báo hữu ích hơn
        let message = 'Xác thực Google thất bại';
        let httpStatus = 401;

        if (error.message?.includes('no registered origin')) {
            message = 'Lỗi cấu hình Google OAuth: Origin chưa được đăng ký trong Google Cloud Console. ' +
                      'Vào Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web) → ' +
                      'Authorized JavaScript origins → thêm origin của bạn (VD: http://localhost:5173)';
            httpStatus = 400;
        } else if (error.message?.includes('invalid_client')) {
            message = 'Lỗi cấu hình Google OAuth: Client ID không hợp lệ hoặc chưa được đăng ký đúng origin/redirect URI';
            httpStatus = 400;
        } else if (error.message?.includes('Wrong number of segments') || error.message?.includes('Invalid token')) {
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
};
