export type SpeechErrorCode = 'unsupported' | 'permission' | 'network' | 'aborted' | 'unknown';

export class SpeechRecognitionError extends Error {
  constructor(public readonly code: SpeechErrorCode) {
    super(code);
  }
}

export interface ListenOptions {
  lang: string;
  timeoutMs: number;
  hints?: string[];
}

export interface SpeechRecognizer {
  isAvailable(): boolean;
  requestPermission(): Promise<boolean>;
  /** 인식 후보 문장들. 아무 말도 없으면 빈 배열 */
  listen(options: ListenOptions): Promise<string[]>;
  stop(): void;
}
