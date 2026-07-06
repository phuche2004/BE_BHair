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
        const { keyword, lat, long, radius = 5 } = req.query;
        let shops = lat && long
            ? shop_model_1.default.findNearby(parseFloat(lat), parseFloat(long), parseFloat(radius))
            : shop_model_1.default.findAll({ isActive: true });
        if (keyword) {
            const kw = keyword.toLowerCase();
            shops = shops.filter((shop) => shop.name.toLowerCase().includes(kw) ||
                shop.address.toLowerCase().includes(kw));
        }
        res.json(shops);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.searchShops = searchShops;
