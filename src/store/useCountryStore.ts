import { PublicAxios } from "@/lib/publicAxios";
import { ICountry } from "@/types/misc";
import { create } from "zustand";

const CACHE_KEY = "countries";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: ICountry[];
  timestamp: number;
}

interface CountryStore {
  countries: ICountry[];
  loading: boolean;
  error: string | null;
  fetchCountries: (forceRefresh?: boolean) => Promise<void>;
}

const useCountryStore = create<CountryStore>((set, get) => ({
  countries: [],
  loading: false,
  error: null,

  fetchCountries: async (forceRefresh = false) => {
    // Prevent duplicate fetches
    if (get().loading) return;

    // Check cache first
    if (!forceRefresh) {
      try {
        const cachedString = localStorage.getItem(CACHE_KEY);
        if (cachedString) {
          const cached: CachedData = JSON.parse(cachedString);
          const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;

          if (!isExpired && cached.data?.length > 0) {
            set({ countries: cached.data, loading: false, error: null });
            return;
          }
        }
      } catch (err) {
        // Invalid cache, continue to fetch; log and clear
        console.warn("Invalid cached countries, clearing cache", err);
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // Fetch from API
    set({ loading: true, error: null });

    try {
      const response = await PublicAxios.get("/countries/");
      const data: ICountry[] = response?.data || [];

      // Cache the data
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      set({ countries: data, loading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch countries";
      set({ loading: false, error: errorMessage });
      console.error("Error fetching countries:", err);
    }
  },
}));

export default useCountryStore;