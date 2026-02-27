export type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'STAFF';

export interface User {
    _id: string;
    phoneNumber: string;
    fullName: string;
    role: Role;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Shop {
    _id: string;
    name: string;
    address: string;
    phone: string;
    images: string[];
    openTime: string;
    closeTime: string;
    slotDuration: number;
    managerId: string; // Ref to User
    location?: {
        type: string;
        coordinates: number[]; // [longitude, latitude]
    };
    rating?: number;
    reviewCount?: number;
}

export interface Service {
    _id: string;
    shopId: string;
    name: string;
    price: number;
    duration: number; // in minutes
    managerExtraFee?: number;
}

export interface Barber {
    _id: string;
    fullName: string;
    avatar?: string;
}

export interface Appointment {
    _id: string;
    shopId: Shop | string;
    customerId: User | string;
    barberId: Barber | string;
    serviceIds: Service[] | string[];
    bookingDate: string; // ISO 8601
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    totalPrice: number;
    note?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
