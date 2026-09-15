import { Tabs } from 'expo-router';

import { AppTabBar } from '@/app-shell/AppTabBar';
import { TABS } from '@/app-shell/tabs';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="history">
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
