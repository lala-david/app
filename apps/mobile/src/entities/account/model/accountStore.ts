import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage, storageKey } from '@/shared/lib/storage';

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  consentVersion: string;
  notifyConsent: boolean;
  createdAt: number;
}

interface AccountState {
  accounts: Record<string, Account>;
  hydrated: boolean;
  upsert: (account: Account) => void;
  remove: (email: string) => void;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** 기기에 저장되는 계정 목록. 서버 연동 시 AccountRepository 구현만 교체한다 */
export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: {},
      hydrated: false,
      upsert: (account) => set({ accounts: { ...get().accounts, [normalizeEmail(account.email)]: account } }),
      remove: (email) => {
        const { [normalizeEmail(email)]: _removed, ...rest } = get().accounts;
        set({ accounts: rest });
      },
    }),
    {
      name: storageKey('accounts'),
      storage: persistStorage,
      partialize: ({ accounts }) => ({ accounts }),
      onRehydrateStorage: () => () => useAccountStore.setState({ hydrated: true }),
    },
  ),
);
