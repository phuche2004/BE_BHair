export type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'STAFF';

export interface User {
  _id: string;
  phoneNumber: string;
  fullName: string;
  role: Role;
  avatar?: string;
  shopId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  _id: string;
  name: string;
  address: string;
  phone: string;
  images: string[];
  images1?: string[];
  openTime: string;
  closeTime: string;
  slotDuration: number;
  managerId: string;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface Service {
  _id: string;
  shopId: string;
  name: string;
  price: number;
  duration: number;
  managerExtraFee?: number;
  coverImg?: string;
}

export interface Barber {
  _id: string;
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
}

export interface Appointment {
  _id: string;
  shopId: Shop | string;
  customerId: User | string;
  barberId: Barber | string | null;
  serviceIds: Service[] | string[];
  bookingDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalPrice: number;
  note?: string;
  customerName?: string;
  customerPhone?: string;
  userId?: User;
  startTime?: string;
  date?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  totalCapacity: number;
}

export interface Review {
  _id: string;
  appointmentId: string;
  userId: User | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
