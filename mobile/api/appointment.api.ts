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
};