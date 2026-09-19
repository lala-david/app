import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 배포 경로(baseUrl)는 환경 변수로 받는다.
 *   GitHub Pages: EXPO_PUBLIC_BASE_URL=app npm run build:web
 * Git Bash는 "/app"을 "C:/Program Files/Git/app"으로 바꿔 버리므로 마지막 경로 이름만 쓴다.
 */
function normalizeBaseUrl(raw: string | undefined): string | undefined {
  const segment = raw?.split(/[\\/]/).filter(Boolean).pop();
  return segment ? `/${segment}` : undefined;
}

const baseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_BASE_URL);

const BRAND = { yellow: '#FFD640', ground: '#FAF8F5', splash: '#2D1B68' };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SoundsFun',
  slug: 'soundsfun-bridge',
  version: '0.2.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'soundsfun',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'kr.or.rta.soundsfun',
    supportsTablet: false,
  },
  android: {
    package: 'kr.or.rta.soundsfun',
    adaptiveIcon: {
      backgroundColor: BRAND.yellow,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // 정한 시각에 정확히 울리게 하고, 재부팅 뒤에도 예약을 되살린다
    permissions: ['android.permission.POST_NOTIFICATIONS', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.VIBRATE', 'android.permission.RECORD_AUDIO'],
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
    name: 'SoundsFun',
    shortName: 'SoundsFun',
    themeColor: BRAND.yellow,
    backgroundColor: BRAND.ground,
    lang: 'ko',
  },
  plugins: [
    'expo-router',
    'expo-video',
    ['expo-splash-screen', { backgroundColor: BRAND.splash, image: './assets/images/splash-icon.png', imageWidth: 200 }],
    './plugins/withNotificationArt',
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#35AD86', defaultChannel: 'routines' }],
    ['expo-image-picker', { photosPermission: '아이 프로필 사진을 고르기 위해 사진 보관함에 접근해요.' }],
    [
      'expo-speech-recognition',
      {
        microphonePermission: '아이가 영어 단어를 따라 말하는 소리를 듣기 위해 마이크를 사용해요.',
        speechRecognitionPermission: '따라 말한 단어를 확인하기 위해 음성 인식을 사용해요.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    ...(baseUrl ? { baseUrl } : {}),
  },
});
