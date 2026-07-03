import { Request, Response } from 'express';
import Service from '../models/service.model';
import Shop from '../models/shop.model';
import { UserRole } from '../models/user.model';

export const createService = async (req: Request, res: Response) => {
    try {
        const { shopId, name, price, managerExtraFee, duration, description } = req.body;

        // Validate Shop ownership
        const shop = Shop.findById(shopId as string);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        if (shop.managerId?.toString() !== req.user.id && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to add service to this shop' });
        }

        let image = '';
        if (req.file && req.file.path) {
            image = req.file.path;
        }

        const newService = Service.create({
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

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getServicesByShop = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const services = Service.find({ shopId, isActive: true });
        res.json(services);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateService = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const service = Service.findById(id as string);

        if (!service) return res.status(404).json({ message: 'Service not found' });

        // Check shop ownership via service.shopId
        const shop = Shop.findById(service.shopId);
        if (!shop || (shop.managerId?.toString() !== req.user.id && req.user.role !== UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { name, price, managerExtraFee, duration, description, isActive } = req.body;
        if (name) service.name = name;
        if (price) service.price = price;
        if (managerExtraFee !== undefined) service.managerExtraFee = managerExtraFee;
        if (duration) service.duration = duration;
        if (description) service.description = description;
        if (isActive !== undefined) service.isActive = isActive;

        if (req.file && req.file.path) {
            service.image = req.file.path;
        }

        // Removed: await service.save() - SQLite models are immutable
        res.json({ message: 'Service updated', service });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteService = async (req: Request, res: Response) => {
    // Soft delete
    try {
        const { id } = req.params;
        const service = Service.findById(id as string);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        const shop = Shop.findById(service.shopId);
        if (!shop || (shop.managerId?.toString() !== req.user.id && req.user.role !== UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        service.isActive = false;
        // Removed: await service.save() - SQLite models are immutable
        res.json({ message: 'Service deleted (soft)' });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
