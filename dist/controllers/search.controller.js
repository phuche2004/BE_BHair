"use strict";
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
exports.searchShops = void 0;
const shop_model_1 = __importDefault(require("../models/shop.model"));
const searchShops = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, lat, long, radius = 5 } = req.query; // radius in km
        const query = { isActive: true };
        // 1. Text Search (Name or Address)
        if (keyword) {
            // Using MongoDB Text Search (requires text index)
            // query.$text = { $search: keyword as string };
            // OR regex for partial match (simpler but slower on large data)
            // Let's use Regex for better UX with partial words (e.g. "Shi" finds "Shine")
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { address: { $regex: keyword, $options: 'i' } }
            ];
        }
        // 2. Geospatial Search (Near Me)
        if (lat && long) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(long);
            const distanceInMeters = parseFloat(radius) * 1000;
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: distanceInMeters
                }
            };
        }
        const shops = shop_model_1.default.find(query);
        res.json(shops);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.searchShops = searchShops;
