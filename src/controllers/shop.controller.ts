import { Request, Response } from 'express';
import Shop from '../models/shop.model';
import User, { UserRole } from '../models/user.model';

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

        const newShop = new Shop({
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

        await newShop.save();

        // 4. Update User with shopId
        await User.findByIdAndUpdate(req.user.id, { shopId: newShop._id });

        res.status(201).json({ message: 'Shop created successfully', shop: newShop });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyShops = async (req: Request, res: Response) => {
    try {
        const shops = await Shop.find({ managerId: req.user.id });
        res.json(shops);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getShopById = async (req: Request, res: Response) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('managerId', 'fullName avatar phoneNumber');
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateShop = async (req: Request, res: Response) => {
    try {
        const shopId = req.params.id;
        const shop = await Shop.findById(shopId);

        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        // Check ownership
        if (shop.managerId.toString() !== req.user.id && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to update this shop' });
        }

        // Update basic info
        const { name, address, phone, gender, isActive } = req.body;
        if (name) shop.name = name;
        if (address) shop.address = address;
        if (phone) shop.phone = phone;
        if (gender) shop.gender = gender;
        if (isActive !== undefined) shop.isActive = isActive;

        // Note: Logic to update/delete specific images is complex (omitted for brevity).
        // For now, we assume simple updates or re-upload. 
        // Real implementation would allow removing specific existing images.

        await shop.save();
        res.json({ message: 'Shop updated', shop });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
