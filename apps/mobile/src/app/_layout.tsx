import { Jua_400Regular, useFonts } from '@expo-google-fonts/jua';
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
  const [fontsLoaded] = useFonts({ Jua_400Regular });
  const hydrated = useStoresHydrated();
  const signedIn = useSession((s) => !!s.userId);
  const onboarded = !!useChild()?.onboardingDone;
  const ready = fontsLoaded && hydrated;
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
