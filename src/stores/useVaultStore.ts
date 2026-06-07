import { create } from 'zustand'

/**
 * In-memory store for the vault's derived CryptoKey.
 * The key is held ONLY in RAM — never persisted to localStorage or Supabase.
 * It disappears when the tab/app is closed or when the user clicks "Travar cofre".
 */
interface VaultState {
  cryptoKey: CryptoKey | null
  setKey: (key: CryptoKey | null) => void
  lock: () => void
}

export const useVaultStore = create<VaultState>((set) => ({
  cryptoKey: null,
  setKey: (key) => set({ cryptoKey: key }),
  lock: () => set({ cryptoKey: null }),
}))
