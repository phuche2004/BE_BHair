import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  restoreToken: (token: string, user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: (user, token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    set({ user: null, token: null, isLoading: false });
  },

  restoreToken: (token, user) => {
    set({ user, token, isLoading: false });
  },
}));

// Initialize from localStorage on app load
const storedToken = localStorage.getItem('userToken');
const storedUser = localStorage.getItem('userData');
if (storedToken && storedUser) {
  try {
    useAuthStore.getState().restoreToken(storedToken, JSON.parse(storedUser));
  } catch {
    useAuthStore.getState().restoreToken('', null as unknown as User);
  }
} else {
  useAuthStore.getState().restoreToken('', null as unknown as User);
}
