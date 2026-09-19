import { accountRepository, type SignUpInput } from '@/entities/account/api/accountRepository';
import { useChildStore } from '@/entities/child/model/childStore';
import { useProgressStore } from '@/entities/progress/model/progressStore';
import { useSession } from '@/entities/session/model/sessionStore';
import { useAnalytics } from '@/shared/analytics/analytics';
import { notificationScheduler } from '@/shared/platform/notifications';

function startSession(userId: string) {
  useSession.getState().signIn(userId);
  useAnalytics.getState().setUser(userId);
}

export async function signUp(input: SignUpInput) {
  const result = await accountRepository.signUp(input);
  if (result.ok) startSession(result.value.id);
  return result;
}

export async function logIn(email: string, password: string) {
  const result = await accountRepository.logIn(email, password);
  if (result.ok) startSession(result.value.id);
  return result;
}

export async function logOut() {
  await notificationScheduler.replaceUpcoming([]);
  useAnalytics.getState().setUser(null);
  useSession.getState().signOut();
}

/** 계정과 이 계정의 모든 기록·사진을 기기에서 지운다 */
export async function deleteAccount() {
  const userId = useSession.getState().userId;
  if (!userId) return;
  await notificationScheduler.replaceUpcoming([]);
  useChildStore.getState().remove(userId);
  useProgressStore.getState().removeUser(userId);
  useAnalytics.getState().clearUser(userId);
  await accountRepository.remove(userId);
  useAnalytics.getState().setUser(null);
  useSession.getState().signOut();
}
