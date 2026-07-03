import { Request, Response } from 'express';
import Review from '../models/reviews.model';
import Appointment, { AppointmentStatus } from '../models/appointment.model';
import Shop from '../models/shop.model';

export const createReview = async (req: Request, res: Response) => {
    try {
        const { appointmentId, rating, comment } = req.body;

        // 1. Check Appointment
        const appointment = Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // 2. Verify Ownership & Status
        if (appointment.customerId?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only review your own appointments' });
        }

        if (appointment.status !== AppointmentStatus.COMPLETED) {
            return res.status(400).json({ message: 'You can only review completed appointments' });
        }

        // 3. Check Duplicate (Schema unique index protects this too)
        const existingReview = Review.findOne({ appointmentId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this appointment' });
        }

        // 4. Create Review
        const newReview = Review.create({
            appointmentId,
            shopId: appointment.shopId,
            customerId: req.user.id,
            barberId: appointment.barberId || undefined,
            rating,
            comment
        });

        // Update appointment status to completed after review

        // 5. Update Shop Average Rating
        const shopId = appointment.shopId;
        const stats = Review.aggregate([
            { $match: { shopId: shopId } },
            {
                $group: {
                    _id: '$shopId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            Shop.findByIdAndUpdate(shopId, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
                totalReviews: stats[0].totalReviews
            });
        }

        res.status(201).json({ message: 'Review created', review: newReview });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getShopReviews = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const reviews = Review.find({ shopId: shopId as string })
            
            ;

        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
