import { axiosInstance } from './index';

export const serviceApi = {
    createService: async (data: any) => {
        const response = await axiosInstance.post('/service', data);
        return response.data;
    },
    updateService: async (id: string, data: any) => {
        const response = await axiosInstance.put(`/service/${id}`, data);
        return response.data;
    },
    deleteService: async (id: string) => {
        const response = await axiosInstance.delete(`/service/${id}`);
        return response.data;
    }
};
