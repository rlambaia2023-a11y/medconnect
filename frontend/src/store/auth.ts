import { create } from 'zustand';
import { getUser, logout as doLogout } from '../lib/api';

interface AuthState {
  user: any | null;
  setUser: (u: any) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: getUser(),
  setUser: (u) => set({ user: u }),
  logout: () => { doLogout(); set({ user: null }); },
  isAuthenticated: () => !!get().user,
}));