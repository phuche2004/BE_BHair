import { axiosInstance } from './index';

export const shopApi = {
  getAllShops: async () => {
    const response = await axiosInstance.get('/search');
    return response.data;
  },
  searchShops: async (keyword: string) => {
    const response = await axiosInstance.get(`/search?keyword=${encodeURIComponent(keyword)}`);
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
  createShop: async (data: FormData | object) => {
    const response = await axiosInstance.post('/shop', data, {
      timeout: 120000, // 2 minutes timeout for upload
    });
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
  getShopStaff: async (shopId: string) => {
    const response = await axiosInstance.get(`/shop/${shopId}/staff`);
    return response.data;
  },
  getShopReviews: async (shopId: string) => {
    const response = await axiosInstance.get(`/review/shop/${shopId}`);
    return response.data;
  },
  updateShop: async (shopId: string, data: FormData | object) => {
    const response = await axiosInstance.put(`/shop/${shopId}`, data, {
      timeout: 120000, // 2 minutes timeout for upload
    });
    return response.data;
  },
  getShopSlots: async (shopId: string, date: string, barberId?: string) => {
    let url = `/shop/${shopId}/slots?date=${date}`;
    if (barberId) url += `&barberId=${barberId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
