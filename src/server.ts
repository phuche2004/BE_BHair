import dotenv from 'dotenv';
// Load env vars - Tip: You can create a .env.local to override .env
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import connectDB from './config/database';
import { verifyCloudinaryConnection } from './config/cloudinary.config';
import morgan from 'morgan';

// Connect to database
connectDB();
// Verify Cloudinary
verifyCloudinaryConnection();

const app: Application = express();
const PORT = process.env.PORT || 1000;

// Routes
import authRoutes from './routes/auth.route';
import shopRoutes from './routes/shop.route';
import serviceRoutes from './routes/service.route';
import appointmentRoutes from './routes/appointment.route';
import searchRoutes from './routes/search.route';
import reviewRoutes from './routes/review.route';
import notificationRoutes from './routes/notification.route';
import slotRoutes from './routes/slot.route';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Log HTTP requests
}

// Route registrations
app.use('/api/v1/user', authRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/service', serviceRoutes);
app.use('/api/v1/appointment', appointmentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1', slotRoutes); // Mount at root /api/v1 because route already has /shop prefix

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

// Start server
// Start server
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

export default app;
