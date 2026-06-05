import { axiosInstance } from './index';
import { AuthResponse, User } from '../types';

export const authApi = {
  login: async (phoneNumber: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/user/login', { phoneNumber, password });
    return response.data.metadata || response.data;
  },

  register: async (
    fullName: string,
    phoneNumber: string,
    password: string,
    role: string = 'CUSTOMER'
  ): Promise<{ message: string; user?: User }> => {
    const response = await axiosInstance.post('/user/register', { fullName, phoneNumber, password, role });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get('/user/profile');
    return response.data.metadata || response.data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/user/google', { idToken });
    return response.data.metadata || response.data;
  },
};
