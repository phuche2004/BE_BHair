import { Request, Response } from 'express';
import User, { UserRole } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Helper to generate Token
const generateToken = (user: any) => {
    return jwt.sign(
        { id: user._id, role: user.role, fullName: user.fullName },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    );
};

export const register = async (req: Request, res: Response) => {
    try {
        const { fullName, phoneNumber, password } = req.body;

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

        const newUser = new User({
            fullName,
            phoneNumber,
            password: hashedPassword,
            role: UserRole.CUSTOMER, // Default role
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
