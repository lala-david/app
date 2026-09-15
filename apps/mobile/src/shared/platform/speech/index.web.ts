import { SpeechRecognitionError, type ListenOptions, type SpeechRecognizer } from './types';

export * from './types';

interface BrowserRecognitionAlternative {
  transcript: string;
}
interface BrowserRecognitionEvent {
  results: ArrayLike<ArrayLike<BrowserRecognitionAlternative> & { isFinal: boolean }>;
}
interface BrowserRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: BrowserRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => BrowserRecognition;

const getConstructor = (): RecognitionConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const ERROR_CODES: Record<string, SpeechRecognitionError['code']> = {
  'not-allowed': 'permission',
  'service-not-allowed': 'permission',
  network: 'network',
  aborted: 'aborted',
};

let active: BrowserRecognition | null = null;

export const speechRecognizer: SpeechRecognizer = {
  isAvailable: () => !!getConstructor(),

  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  },

  listen({ lang, timeoutMs }: ListenOptions) {
    const Recognition = getConstructor();
    if (!Recognition) return Promise.reject(new SpeechRecognitionError('unsupported'));

    return new Promise<string[]>((resolve, reject) => {
      const recognition = new Recognition();
      let settled = false;
      const timer = setTimeout(() => recognition.stop(), timeoutMs);

      const finish = (result: string[] | SpeechRecognitionError) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        active = null;
        if (result instanceof SpeechRecognitionError) reject(result);
        else resolve(result);
      };

      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 5;
      recognition.onresult = (event) => {
        const first = event.results[0];
        finish(Array.from({ length: first.length }, (_, i) => first[i].transcript));
      };
      recognition.onerror = (event) => {
        if (event.error === 'no-speech') finish([]);
        else finish(new SpeechRecognitionError(ERROR_CODES[event.error] ?? 'unknown'));
      };
      recognition.onend = () => finish([]);

      active = recognition;
      recognition.start();
    });
  },

  stop() {
    active?.stop();
  },
};
