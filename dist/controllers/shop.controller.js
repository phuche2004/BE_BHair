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
exports.getShopHistory = exports.updateShop = exports.getShopById = exports.getMyShops = exports.createShop = void 0;
const shop_model_1 = __importDefault(require("../models/shop.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const getCloudinaryPublicIdAndType = (url) => {
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
const createShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Check permission
        if (req.user.role !== user_model_1.UserRole.MANAGER && req.user.role !== user_model_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Only Managers can create shops' });
        }
        // 2. Handle files
        // req.files is an object with keys: images1, images2, images3, videos
        const files = req.files;
        const getPaths = (fieldname) => {
            var _a;
            return ((_a = files === null || files === void 0 ? void 0 : files[fieldname]) === null || _a === void 0 ? void 0 : _a.map((file) => file.path)) || [];
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
            }
            catch (e) {
                if (Array.isArray(coordinates))
                    parsedCoordinates = coordinates;
            }
        }
        const newShop = shop_model_1.default.create({
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
        user_model_1.default.findByIdAndUpdate(req.user.id, { shopId: newShop.id });
        res.status(201).json({ message: 'Shop created successfully', shop: newShop });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createShop = createShop;
const getMyShops = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shops = shop_model_1.default.find({ managerId: req.user.id });
        res.json(shops);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getMyShops = getMyShops;
const getShopById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shop = shop_model_1.default.findById(req.params.id);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getShopById = getShopById;
const updateShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const shopId = req.params.id;
        const shop = shop_model_1.default.findById(shopId);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        // Check ownership
        if (((_a = shop.managerId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to update this shop' });
        }
        // Update basic info
        const { name, address, phone, gender, isActive, openTime, closeTime, breakStart, breakEnd, slotDuration, coordinates, deleteUrls } = req.body;
        if (name !== undefined)
            shop.name = name;
        if (address !== undefined)
            shop.address = address;
        if (phone !== undefined)
            shop.phone = phone;
        if (gender !== undefined)
            shop.gender = gender;
        if (isActive !== undefined)
            shop.isActive = isActive;
        // Schedule info
        if (openTime !== undefined)
            shop.openTime = openTime;
        if (closeTime !== undefined)
            shop.closeTime = closeTime;
        if (breakStart !== undefined)
            shop.breakStart = breakStart;
        if (breakEnd !== undefined)
            shop.breakEnd = breakEnd;
        if (slotDuration !== undefined)
            shop.slotDuration = slotDuration;
        // Update coordinates
        if (coordinates) {
            try {
                const parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2) {
                    shop.latitude = latitude;
                    shop.longitude = longitude;
                }
            }
            catch (e) {
                // Ignore parsing errors
            }
        }
        // Handle deleting specific images/videos
        if (deleteUrls) {
            let urlsToDelete = [];
            try {
                urlsToDelete = typeof deleteUrls === 'string' ? JSON.parse(deleteUrls) : deleteUrls;
            }
            catch (e) {
                if (Array.isArray(deleteUrls))
                    urlsToDelete = deleteUrls;
            }
            if (urlsToDelete.length > 0) {
                const images1Array = Array.isArray(shop.images1) ? shop.images1 : (shop.images1 ? JSON.parse(shop.images1) : []);
                const images2Array = Array.isArray(shop.images2) ? shop.images2 : (shop.images2 ? JSON.parse(shop.images2) : []);
                const images3Array = Array.isArray(shop.images3) ? shop.images3 : (shop.images3 ? JSON.parse(shop.images3) : []);
                const videosArray = Array.isArray(shop.videos) ? shop.videos : (shop.videos ? JSON.parse(shop.videos) : []);
                shop_model_1.default.findByIdAndUpdate(shopId, {
                    images1: images1Array.filter((u) => !urlsToDelete.includes(u)),
                    images2: images2Array.filter((u) => !urlsToDelete.includes(u)),
                    images3: images3Array.filter((u) => !urlsToDelete.includes(u)),
                    videos: videosArray.filter((u) => !urlsToDelete.includes(u))
                });
                // Delete from Cloudinary to free storage quota
                for (const url of urlsToDelete) {
                    const mediaInfo = getCloudinaryPublicIdAndType(url);
                    if (mediaInfo) {
                        try {
                            yield cloudinary_config_1.default.uploader.destroy(mediaInfo.publicId, { resource_type: mediaInfo.resourceType });
                            console.log(`Successfully deleted from Cloudinary: ${mediaInfo.publicId} (${mediaInfo.resourceType})`);
                        }
                        catch (err) {
                            console.error(`Failed to delete Cloudinary asset: ${url}`, err.message);
                        }
                    }
                }
            }
        }
        // Handle new file uploads
        const files = req.files;
        const getPaths = (fieldname) => {
            var _a;
            return ((_a = files === null || files === void 0 ? void 0 : files[fieldname]) === null || _a === void 0 ? void 0 : _a.map((file) => file.path)) || [];
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
                            yield cloudinary_config_1.default.uploader.destroy(mediaInfo.publicId, { resource_type: mediaInfo.resourceType });
                            console.log(`Auto-deleted old cover image: ${mediaInfo.publicId}`);
                        }
                        catch (err) {
                            console.error(`Failed to delete old cover image: ${url}`, err.message);
                        }
                    }
                }
            }
            shop.images1 = newImages1;
        }
        if (newImages2.length > 0) {
            const currentImages2 = Array.isArray(shop.images2) ? shop.images2 : (shop.images2 ? JSON.parse(shop.images2) : []);
            shop_model_1.default.findByIdAndUpdate(shopId, { images2: [...currentImages2, ...newImages2] });
        }
        if (newImages3.length > 0) {
            const currentImages3 = Array.isArray(shop.images3) ? shop.images3 : (shop.images3 ? JSON.parse(shop.images3) : []);
            shop_model_1.default.findByIdAndUpdate(shopId, { images3: [...currentImages3, ...newImages3] });
        }
        if (newVideos.length > 0) {
            const currentVideos = Array.isArray(shop.videos) ? shop.videos : (shop.videos ? JSON.parse(shop.videos) : []);
            shop_model_1.default.findByIdAndUpdate(shopId, { videos: [...currentVideos, ...newVideos] });
        }
        // Refresh shop data after updates
        shop = shop_model_1.default.findById(shopId);
        res.json({ message: 'Shop updated', shop });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateShop = updateShop;
const getShopHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const HistoryLog = require('../models/history.model').default;
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        let query = { shopId };
        // Date filtering
        if (req.query.date) {
            const dateStr = req.query.date;
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getShopHistory = getShopHistory;
