import type { SpeechRecognizer } from './types';

export * from './types';

/** 지원하지 않는 환경의 기본 구현. 플랫폼별 파일(index.web.ts / index.native.ts)이 대신한다 */
export const speechRecognizer: SpeechRecognizer = {
  isAvailable: () => false,
  requestPermission: async () => false,
  listen: async () => [],
  stop: () => undefined,
};
