import { createId } from '@/shared/lib/id';
import { createSalt, hashPassword } from '@/shared/platform/crypto';

import { normalizeEmail, useAccountStore, type Account } from '../model/accountStore';

export type SignUpError = 'duplicate';
export type LogInError = 'wrongCredentials';

export interface SignUpInput {
  email: string;
  password: string;
  consentVersion: string;
  notifyConsent: boolean;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface AccountRepository {
  signUp(input: SignUpInput): Promise<Result<Account, SignUpError>>;
  logIn(email: string, password: string): Promise<Result<Account, LogInError>>;
  findById(id: string): Account | undefined;
  remove(id: string): Promise<void>;
}

/** 기기 저장 구현 (MVP). apps/api 연결 시 같은 인터페이스의 원격 구현으로 바꾼다 */
export const localAccountRepository: AccountRepository = {
  async signUp({ email, password, consentVersion, notifyConsent }) {
    const key = normalizeEmail(email);
    if (useAccountStore.getState().accounts[key]) return { ok: false, error: 'duplicate' };
    const salt = createSalt();
    const account: Account = {
      id: createId(),
      email: key,
      salt,
      passwordHash: await hashPassword(password, salt),
      consentVersion,
      notifyConsent,
      createdAt: Date.now(),
    };
    useAccountStore.getState().upsert(account);
    return { ok: true, value: account };
  },

  async logIn(email, password) {
    const account = useAccountStore.getState().accounts[normalizeEmail(email)];
    if (!account) return { ok: false, error: 'wrongCredentials' };
    const hash = await hashPassword(password, account.salt);
    return hash === account.passwordHash ? { ok: true, value: account } : { ok: false, error: 'wrongCredentials' };
  },

  findById(id) {
    return Object.values(useAccountStore.getState().accounts).find((a) => a.id === id);
  },

  async remove(id) {
    const account = this.findById(id);
    if (account) useAccountStore.getState().remove(account.email);
  },
};

export const accountRepository: AccountRepository = localAccountRepository;
