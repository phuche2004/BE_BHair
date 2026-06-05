import { axiosInstance } from './index';

export const appointmentApi = {
  getMyAppointments: async () => {
    const response = await axiosInstance.get('/appointment/me');
    return response.data;
  },
  getAppointmentById: async (id: string) => {
    const response = await axiosInstance.get(`/appointment/${id}`);
    return response.data;
  },
  getShopAppointments: async (shopId: string) => {
    const response = await axiosInstance.get(`/appointment/shop/${shopId}`);
    return response.data;
  },
  updateAppointmentStatus: async (id: string, status: string) => {
    if (status === 'CANCELLED') {
      const response = await axiosInstance.patch(`/appointment/${id}/cancel`);
      return response.data;
    }
    const response = await axiosInstance.patch(`/appointment/${id}/status`, { status });
    return response.data;
  },
  createAppointment: async (data: {
    shopId: string;
    serviceIds: string[];
    barberId?: string | null;
    bookingDate: string;
    note?: string;
  }) => {
    const response = await axiosInstance.post('/appointment', data);
    return response.data;
  },
  submitReview: async (data: {
    appointmentId: string;
    rating: number;
    comment: string;
  }) => {
    const response = await axiosInstance.post('/review', data);
    return response.data;
  },
};
