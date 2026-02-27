import { axiosInstance } from './index';

export const shopApi = {
    getAllShops: async () => {
        const response = await axiosInstance.get('/search');
        return response.data;
    },
    getMyShops: async () => {
        const response = await axiosInstance.get('/shop/my-shops');
        return response.data;
    },
    getShopDetails: async (shopId: string) => {
        const response = await axiosInstance.get(`/shop/${shopId}`);
        return response.data;
    },
    getShopServices: async (shopId: string) => {
        const response = await axiosInstance.get(`/service/shop/${shopId}`);
        return response.data;
    },
    getShopSlots: async (shopId: string, date: string, barberId?: string) => {
        // BE route: GET /shop/:shopId/slots?date=YYYY-MM-DD
        let url = `/shop/${shopId}/slots?date=${date}`;
        if (barberId) {
            url += `&barberId=${barberId}`;
        }
        const response = await axiosInstance.get(url);
        // BE returns: Array<{ time: string; available: boolean; bookedCount: number; totalCapacity: number }>
        return response.data;
    }
};
