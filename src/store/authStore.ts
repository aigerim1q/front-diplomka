import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser, UserRole } from '@/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null

  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  hasRole: (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, refreshToken })
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ accessToken: null, refreshToken: null, user: null })
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,

      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)