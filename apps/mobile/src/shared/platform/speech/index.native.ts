import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { SpeechRecognitionError, type ListenOptions, type SpeechRecognizer } from './types';

export * from './types';

const ERROR_CODES: Record<string, SpeechRecognitionError['code']> = {
  'not-allowed': 'permission',
  'service-not-allowed': 'permission',
  network: 'network',
  aborted: 'aborted',
};

export const speechRecognizer: SpeechRecognizer = {
  isAvailable: () => {
    try {
      return ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  },

  async requestPermission() {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  },

  listen({ lang, timeoutMs, hints }: ListenOptions) {
    return new Promise<string[]>((resolve, reject) => {
      let settled = false;
      const subscriptions = [
        ExpoSpeechRecognitionModule.addListener('result', (event) => {
          if (event.isFinal) finish(event.results.map((r) => r.transcript));
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event) => {
          if (event.error === 'no-speech' || event.error === 'speech-timeout') finish([]);
          else finish(new SpeechRecognitionError(ERROR_CODES[event.error] ?? 'unknown'));
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => finish([])),
      ];
      const timer = setTimeout(() => ExpoSpeechRecognitionModule.stop(), timeoutMs);

      function finish(result: string[] | SpeechRecognitionError) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        subscriptions.forEach((s) => s.remove());
        if (result instanceof SpeechRecognitionError) reject(result);
        else resolve(result);
      }

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: false,
        continuous: false,
        maxAlternatives: 5,
        contextualStrings: hints,
      });
    });
  },

  stop() {
    ExpoSpeechRecognitionModule.stop();
  },
};
