import { Request, Response } from 'express';
import Shop from '../models/shop.model';

export const searchShops = async (req: Request, res: Response) => {
    try {
        const { keyword, lat, long, radius = 5 } = req.query; // radius in km

        const query: any = { isActive: true };

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
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(long as string);
            const distanceInMeters = parseFloat(radius as string) * 1000;

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

        const shops = Shop.find(query);
        res.json(shops);

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
