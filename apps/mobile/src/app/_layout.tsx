import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { usePwaHead } from '@/app-shell/usePwaHead';
import { useStoresHydrated } from '@/app-shell/useStoresHydrated';
import { useChild } from '@/entities/child/model/childStore';
import { useSession } from '@/entities/session/model/sessionStore';
import { NotificationBridge } from '@/features/notifications/ui/NotificationBridge';
import { SplashOverlay } from '@/features/splash/ui/SplashOverlay';
import { initAudio } from '@/shared/platform/sound';
import { AppFrame } from '@/shared/ui/AppFrame';
import { FeedbackHost } from '@/shared/ui/FeedbackHost';
import { colors } from '@/shared/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 글꼴은 프로젝트 자산으로 두고 불러온다. 실패해도 기본 글꼴로 앱을 띄운다
  const [fontsLoaded, fontError] = useFonts({ BinggraeBold: require('@/assets/fonts/Binggrae-Bold.ttf') });
  const hydrated = useStoresHydrated();
  const signedIn = useSession((s) => !!s.userId);
  const onboarded = !!useChild()?.onboardingDone;
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="manage" />
        </Stack.Protected>
      </Stack>
      {signedIn && onboarded ? <NotificationBridge /> : null}
      <FeedbackHost />
      <SplashOverlay />
    </AppFrame>
  );
}
