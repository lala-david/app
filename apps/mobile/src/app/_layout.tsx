import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useStoresHydrated } from '@/app-shell/useStoresHydrated';
import { usePwaHead } from '@/app-shell/usePwaHead';
import { useChild } from '@/entities/child/model/childStore';
import { useSession } from '@/entities/session/model/sessionStore';
import { NotificationBridge } from '@/features/notifications/ui/NotificationBridge';
import { ParentGateHost } from '@/features/parent-gate/ui/ParentGateHost';
import { initAudio } from '@/shared/platform/sound';
import { AppFrame } from '@/shared/ui/AppFrame';
import { FeedbackHost } from '@/shared/ui/FeedbackHost';
import { colors } from '@/shared/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 글꼴은 프로젝트 자산으로 두고 불러온다 (node_modules 경로는 배포에서 빠질 수 있다)
  const [fontsLoaded, fontError] = useFonts({ Jua_400Regular: require('@/assets/fonts/Jua-Regular.ttf') });
  const hydrated = useStoresHydrated();
  const signedIn = useSession((s) => !!s.userId);
  const onboarded = !!useChild()?.onboardingDone;
  // 글꼴을 못 불러와도 기본 글꼴로 앱을 띄운다
  const ready = (fontsLoaded || !!fontError) && hydrated;
  usePwaHead();

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
    void initAudio();
  }, [ready]);

  if (!ready) return null;

  return (
    <AppFrame>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgChild }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="manage" />
        </Stack.Protected>
      </Stack>
      {signedIn && onboarded ? <NotificationBridge /> : null}
      <ParentGateHost />
      <FeedbackHost />
    </AppFrame>
  );
}
