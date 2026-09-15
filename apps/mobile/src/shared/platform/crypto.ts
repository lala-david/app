import * as Crypto from 'expo-crypto';

export function createSalt(): string {
  return Crypto.randomUUID();
}

/** 기기 저장 계정용 비밀번호 해시. 서버 연동 시 서버(argon2)로 옮긴다 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}
