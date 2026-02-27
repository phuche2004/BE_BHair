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
        // The backend has a special route for Customers to cancel their own appointments
        if (status === 'CANCELLED') {
            const response = await axiosInstance.patch(`/appointment/${id}/cancel`);
            return response.data;
        }

        // For other statuses (NO_SHOW, COMPLETED, etc. by STAFF/MANAGER)
        const response = await axiosInstance.patch(`/appointment/${id}/status`, { status });
        return response.data;
    },
};