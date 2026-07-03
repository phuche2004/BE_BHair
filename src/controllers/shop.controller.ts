import { Request, Response } from 'express';
import Shop from '../models/shop.model';
import User, { UserRole } from '../models/user.model';
import cloudinary from '../config/cloudinary.config';

const getCloudinaryPublicIdAndType = (url: string) => {
    const regex = /\/(image|video)\/upload\/(?:v\d+\/)?(.+)$/;
    const match = url.match(regex);
    if (match) {
        const resourceType = match[1]; // 'image' or 'video'
        const fullPath = match[2];
        const publicId = fullPath.split('.').slice(0, -1).join('.');
        return { publicId, resourceType };
    }
    return null;
};

export const createShop = async (req: Request, res: Response) => {
    try {
        // 1. Check permission
        if (req.user.role !== UserRole.MANAGER && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Only Managers can create shops' });
        }

        // 2. Handle files
        // req.files is an object with keys: images1, images2, images3, videos
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const getPaths = (fieldname: string) => {
            return files?.[fieldname]?.map((file) => file.path) || [];
        };

        const images1 = getPaths('images1');
        const images2 = getPaths('images2');
        const images3 = getPaths('images3');
        const videos = getPaths('videos');

        // 3. Create shop
        const { name, address, phone, gender, description, coordinates } = req.body;
        // coordinates expected as string "[long, lat]" or array from form-data

        let parsedCoordinates = [0, 0];
        if (coordinates) {
            try {
                parsedCoordinates = JSON.parse(coordinates); // if sent as string
            } catch (e) {
                if (Array.isArray(coordinates)) parsedCoordinates = coordinates;
            }
        }

        const newShop = Shop.create({
            name,
            address,
            phone,
            gender, // MALE/FEMALE/BOTH
            location: {
                type: 'Point',
                coordinates: parsedCoordinates
            },
            images1,
            images2,
            images3,
            videos,
            managerId: req.user.id
        });

        // Removed: await newShop.save() - SQLite models are immutable

        // 4. Update User with shopId
        User.findByIdAndUpdate(req.user.id, { shopId: newShop.id });

        res.status(201).json({ message: 'Shop created successfully', shop: newShop });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyShops = async (req: Request, res: Response) => {
    try {
        const shops = Shop.find({ managerId: req.user.id });
        res.json(shops);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getShopById = async (req: Request, res: Response) => {
    try {
        const shop = Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateShop = async (req: Request, res: Response) => {
    try {
        const shopId = req.params.id;
        const shop = Shop.findById(shopId);

        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        // Check ownership
        if (shop.managerId.toString() !== req.user.id && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to update this shop' });
        }

        // Update basic info
        const { name, address, phone, gender, isActive, openTime, closeTime, breakStart, breakEnd, slotDuration, coordinates, deleteUrls } = req.body;
        if (name !== undefined) shop.name = name;
        if (address !== undefined) shop.address = address;
        if (phone !== undefined) shop.phone = phone;
        if (gender !== undefined) shop.gender = gender;
        if (isActive !== undefined) shop.isActive = isActive;

        // Schedule info
        if (openTime !== undefined) shop.openTime = openTime;
        if (closeTime !== undefined) shop.closeTime = closeTime;
        if (breakStart !== undefined) shop.breakStart = breakStart;
        if (breakEnd !== undefined) shop.breakEnd = breakEnd;
        if (slotDuration !== undefined) shop.slotDuration = slotDuration;

        // Update coordinates
        if (coordinates) {
            try {
                const parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2) {
                    shop.location = {
                        type: 'Point',
                        coordinates: parsedCoordinates
                    };
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        // Handle deleting specific images/videos
        if (deleteUrls) {
            let urlsToDelete: string[] = [];
            try {
                urlsToDelete = typeof deleteUrls === 'string' ? JSON.parse(deleteUrls) : deleteUrls;
            } catch (e) {
                if (Array.isArray(deleteUrls)) urlsToDelete = deleteUrls;
            }

            if (urlsToDelete.length > 0) {
                shop.images1 = (shop.images1 || []).filter((u: string) => !urlsToDelete.includes(u));
                shop.images2 = (shop.images2 || []).filter((u: string) => !urlsToDelete.includes(u));
                shop.images3 = (shop.images3 || []).filter((u: string) => !urlsToDelete.includes(u));
                shop.videos = (shop.videos || []).filter((u: string) => !urlsToDelete.includes(u));

                // Delete from Cloudinary to free storage quota
                for (const url of urlsToDelete) {
                    const mediaInfo = getCloudinaryPublicIdAndType(url);
                    if (mediaInfo) {
                        try {
                            await cloudinary.uploader.destroy(mediaInfo.publicId, { resource_type: mediaInfo.resourceType });
                            console.log(`Successfully deleted from Cloudinary: ${mediaInfo.publicId} (${mediaInfo.resourceType})`);
                        } catch (err: any) {
                            console.error(`Failed to delete Cloudinary asset: ${url}`, err.message);
                        }
                    }
                }
            }
        }

        // Handle new file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const getPaths = (fieldname: string) => {
            return files?.[fieldname]?.map((file) => file.path) || [];
        };

        const newImages1 = getPaths('images1');
        const newImages2 = getPaths('images2');
        const newImages3 = getPaths('images3');
        const newVideos = getPaths('videos');

        if (newImages1.length > 0) {
            if (shop.images1 && shop.images1.length > 0) {
                for (const url of shop.images1) {
                    const mediaInfo = getCloudinaryPublicIdAndType(url);
                    if (mediaInfo) {
                        try {
                            await cloudinary.uploader.destroy(mediaInfo.publicId, { resource_type: mediaInfo.resourceType });
                            console.log(`Auto-deleted old cover image: ${mediaInfo.publicId}`);
                        } catch (err: any) {
                            console.error(`Failed to delete old cover image: ${url}`, err.message);
                        }
                    }
                }
            }
            shop.images1 = newImages1;
        }
        if (newImages2.length > 0) shop.images2 = [...(shop.images2 || []), ...newImages2];
        if (newImages3.length > 0) shop.images3 = [...(shop.images3 || []), ...newImages3];
        if (newVideos.length > 0) shop.videos = [...(shop.videos || []), ...newVideos];

        // Removed: await shop.save() - SQLite models are immutable
        res.json({ message: 'Shop updated', shop });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getShopHistory = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const HistoryLog = require('../models/history.model').default;
        
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        
        let query: any = { shopId };
        
        // Date filtering
        if (req.query.date) {
            const dateStr = req.query.date as string;
            // Parse using Vietnam Time (UTC+7) to avoid timezone mismatch
            const startDate = new Date(`${dateStr}T00:00:00+07:00`);
            const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);
            
            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const logs = HistoryLog.find(query)
            
            .skip(skip)
            .limit(limit);

        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
