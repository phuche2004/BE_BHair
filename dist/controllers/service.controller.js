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
exports.deleteService = exports.updateService = exports.getServicesByShop = exports.createService = void 0;
const service_model_1 = __importDefault(require("../models/service.model"));
const shop_model_1 = __importDefault(require("../models/shop.model"));
const user_model_1 = require("../models/user.model");
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { shopId, name, price, managerExtraFee, duration, description } = req.body;
        // Validate Shop ownership
        const shop = shop_model_1.default.findById(shopId);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        if (((_a = shop.managerId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to add service to this shop' });
        }
        let image = '';
        if (req.file && req.file.path) {
            image = req.file.path;
        }
        const newService = service_model_1.default.create({
            shopId,
            name,
            description, // New field check
            price,
            managerExtraFee: managerExtraFee || 0,
            duration,
            image
        });
        // Removed: await newService.save() - SQLite models are immutable
        res.status(201).json({ message: 'Service created', service: newService });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createService = createService;
const getServicesByShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const services = service_model_1.default.find({ shopId: shopId, isActive: true });
        res.json(services);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getServicesByShop = getServicesByShop;
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const service = service_model_1.default.findById(id);
        if (!service)
            return res.status(404).json({ message: 'Service not found' });
        // Check shop ownership via service.shopId
        const shop = shop_model_1.default.findById(service.shopId);
        if (!shop || (((_a = shop.managerId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { name, price, managerExtraFee, duration, description, isActive } = req.body;
        const updates = {};
        if (name)
            updates.name = name;
        if (price)
            updates.price = price;
        if (managerExtraFee !== undefined)
            updates.managerExtraFee = managerExtraFee;
        if (duration)
            updates.duration = duration;
        if (description)
            updates.description = description;
        if (isActive !== undefined)
            updates.isActive = isActive;
        if (req.file && req.file.path)
            updates.image = req.file.path;
        const updatedService = service_model_1.default.findByIdAndUpdate(id, updates);
        res.json({ message: 'Service updated', service: updatedService });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateService = updateService;
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Soft delete
    try {
        const { id } = req.params;
        const service = service_model_1.default.findById(id);
        if (!service)
            return res.status(404).json({ message: 'Service not found' });
        const shop = shop_model_1.default.findById(service.shopId);
        if (!shop || (((_a = shop.managerId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        service_model_1.default.findByIdAndUpdate(id, { isActive: false });
        res.json({ message: 'Service deleted (soft)' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.deleteService = deleteService;
