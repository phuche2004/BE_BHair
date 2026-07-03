import { Request, Response } from 'express';
import Shop from '../models/shop.model';

export const searchShops = async (req: Request, res: Response) => {
    try {
        const { keyword, lat, long, radius = 5 } = req.query;

        let shops = lat && long
            ? Shop.findNearby(
                parseFloat(lat as string),
                parseFloat(long as string),
                parseFloat(radius as string)
            )
            : Shop.findAll({ isActive: true });

        if (keyword) {
            const kw = (keyword as string).toLowerCase();
            shops = shops.filter(
                (shop) =>
                    shop.name.toLowerCase().includes(kw) ||
                    shop.address.toLowerCase().includes(kw)
            );
        }

        res.json(shops);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
