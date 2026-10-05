import { IUser } from "@/types/user";
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

interface UserStore {
  user: IUser | null;
  sessionVerified: boolean;
  setUser: (user: IUser) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<IUser>) => void;
  isLoading: boolean;
  error: string | null;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
}

// Custom sessionStorage storage for Zustand
const sessionStorageStore: PersistStorage<{ user: IUser | null }> = {
  getItem: (key) => {
    const storedValue = sessionStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  },
  setItem: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key) => {
    sessionStorage.removeItem(key);
  },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      sessionVerified: false,
      isLoading: false,
      error: null,
      showBalance: false,
      setUser: (user) => set({ user, sessionVerified: true, isLoading: false, error: null }),
      setShowBalance: (show) => set({ showBalance: show }),
      clearUser: () => set({ user: null, sessionVerified: false, showBalance: false, isLoading: false, error: null }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "user-storage",
      storage: sessionStorageStore,
      partialize: (state) => ({
        user: state.user,
        showBalance: state.showBalance,
      }),
    }
  )
);
