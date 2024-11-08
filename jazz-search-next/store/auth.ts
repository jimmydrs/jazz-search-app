import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  setAuthenticated: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  setAuthenticated: (token) => set({ isAuthenticated: true, accessToken: token }),
  clearAuth: () => set({ isAuthenticated: false, accessToken: null }),
})) 