import type { QuestionType, SentenceItem } from '@/entities/content/types';

export type Question =
  | { id: string; type: 'pickImage'; answer: string; options: string[] }
  | { id: string; type: 'pickWord'; answer: string; options: string[] }
  | { id: string; type: 'match'; pairs: string[] }
  | { id: string; type: 'sentenceColor'; answer: string; sentence: SentenceItem; options: string[] };

export interface QuizSpec {
  words: readonly string[];
  colorWords: readonly string[];
  sentences: readonly SentenceItem[];
  mix: Record<QuestionType, number>;
  options: Record<QuestionType, number>;
  seed: number;
}

const TYPE_ORDER: QuestionType[] = ['pickImage', 'pickWord', 'sentenceColor', 'match'];

/** 결정적 난수 (mulberry32) — 같은 시드면 같은 퀴즈 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function withDistractors(answer: string, pool: readonly string[], count: number, rng: () => number): string[] {
  const distractors = shuffle(pool.filter((w) => w !== answer), rng).slice(0, Math.max(0, count - 1));
  return shuffle([answer, ...distractors], rng);
}

/** 유형별 개수를 번갈아 배치해 같은 유형이 몰리지 않게 한다 */
export function typeSequence(mix: Record<QuestionType, number>): QuestionType[] {
  const remaining = { ...mix };
  const sequence: QuestionType[] = [];
  while (TYPE_ORDER.some((t) => remaining[t] > 0)) {
    for (const type of TYPE_ORDER) {
      if (remaining[type] > 0) {
        sequence.push(type);
        remaining[type] -= 1;
      }
    }
  }
  return sequence;
}

export function buildQuiz(spec: QuizSpec): Question[] {
  const rng = createRng(spec.seed);
  const wordQueue = shuffle(spec.words, rng);
  const sentenceQueue = shuffle(spec.sentences, rng);
  let wordCursor = 0;
  let sentenceCursor = 0;
  const nextWord = () => wordQueue[wordCursor++ % wordQueue.length];
  const nextSentence = () => sentenceQueue[sentenceCursor++ % sentenceQueue.length];

  return typeSequence(spec.mix).map((type, index): Question => {
    const id = `q${index + 1}`;
    switch (type) {
      case 'pickImage': {
        const answer = nextWord();
        return { id, type, answer, options: withDistractors(answer, spec.words, spec.options.pickImage, rng) };
      }
      case 'pickWord': {
        const answer = nextWord();
        return { id, type, answer, options: withDistractors(answer, spec.words, spec.options.pickWord, rng) };
      }
      case 'sentenceColor': {
        const sentence = nextSentence();
        return {
          id,
          type,
          answer: sentence.answer,
          sentence,
          options: withDistractors(sentence.answer, spec.colorWords, spec.options.sentenceColor, rng),
        };
      }
      case 'match':
        return { id, type, pairs: shuffle(spec.words, rng).slice(0, spec.options.match) };
    }
  });
}

export function questionWord(question: Question): string {
  return question.type === 'match' ? question.pairs.join(',') : question.answer;
}
