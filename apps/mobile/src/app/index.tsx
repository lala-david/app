import { Redirect } from 'expo-router';

import { useChild } from '@/entities/child/model/childStore';
import { useSession } from '@/entities/session/model/sessionStore';

/** 앱 시작점: 로그인·온보딩 상태에 맞는 첫 화면으로 보낸다 */
export default function IndexRoute() {
  const userId = useSession((s) => s.userId);
  const introSeen = useSession((s) => s.introSeen);
  const child = useChild();

  if (!userId) return <Redirect href={introSeen ? '/login' : '/welcome'} />;
  if (!child?.onboardingDone) return <Redirect href="/onboarding/child" />;
  return <Redirect href="/home" />;
}
