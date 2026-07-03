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
    try {
        const { shopId, name, price, managerExtraFee, duration, description } = req.body;
        // Validate Shop ownership
        const shop = shop_model_1.default.findById(shopId);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        if (shop.managerId.toString() !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN) {
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
        const services = service_model_1.default.find({ shopId, isActive: true });
        res.json(services);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getServicesByShop = getServicesByShop;
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const service = service_model_1.default.findById(id);
        if (!service)
            return res.status(404).json({ message: 'Service not found' });
        // Check shop ownership via service.shopId
        const shop = shop_model_1.default.findById(service.shopId);
        if (!shop || (shop.managerId.toString() !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { name, price, managerExtraFee, duration, description, isActive } = req.body;
        if (name)
            service.name = name;
        if (price)
            service.price = price;
        if (managerExtraFee !== undefined)
            service.managerExtraFee = managerExtraFee;
        if (duration)
            service.duration = duration;
        if (description)
            service.description = description;
        if (isActive !== undefined)
            service.isActive = isActive;
        if (req.file && req.file.path) {
            service.image = req.file.path;
        }
        // Removed: await service.save() - SQLite models are immutable
        res.json({ message: 'Service updated', service });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateService = updateService;
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Soft delete
    try {
        const { id } = req.params;
        const service = service_model_1.default.findById(id);
        if (!service)
            return res.status(404).json({ message: 'Service not found' });
        const shop = shop_model_1.default.findById(service.shopId);
        if (!shop || (shop.managerId.toString() !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        service.isActive = false;
        // Removed: await service.save() - SQLite models are immutable
        res.json({ message: 'Service deleted (soft)' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.deleteService = deleteService;
