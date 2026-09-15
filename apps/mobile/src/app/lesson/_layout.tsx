import { Stack } from 'expo-router';

export default function LessonLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />;
}
