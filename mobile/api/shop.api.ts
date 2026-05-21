import { axiosInstance } from './index';

export const shopApi = {
    getAllShops: async () => {
        const response = await axiosInstance.get('/search');
        return response.data;
    },
    getNearbyShops: async (lat: number, long: number, radius = 5) => {
        const response = await axiosInstance.get(`/search?lat=${lat}&long=${long}&radius=${radius}`);
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
    updateShop: async (shopId: string, data: any) => {
        const response = await axiosInstance.put(`/shop/${shopId}`, data);
        return response.data;
    },
    getShopHistory: async (shopId: string, date?: string) => {
        const response = await axiosInstance.get(`/shop/${shopId}/history`, { params: { date } });
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
