export interface SpeechJudgement {
  passed: boolean;
  score: number;
  heard: string;
}

export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest;
}

/**
 * 인식 결과 후보들 중 목표 단어(또는 허용 발음)와 가장 가까운 점수로 판정한다.
 * 문장으로 인식돼도 단어 하나만 맞으면 된다.
 */
export function judgeSpeech(
  target: string,
  alternatives: readonly string[],
  accept: readonly string[] = [],
  threshold = 0.7,
): SpeechJudgement {
  const goals = [target, ...accept].map(normalizeSpeech).filter(Boolean);
  let best = { score: 0, heard: alternatives[0] ?? '' };

  for (const alternative of alternatives) {
    const heard = normalizeSpeech(alternative);
    const candidates = [heard, ...heard.split(' ')].filter(Boolean);
    for (const candidate of candidates) {
      for (const goal of goals) {
        const score = similarity(candidate, goal);
        if (score > best.score) best = { score, heard: alternative };
      }
    }
  }
  return { passed: best.score >= threshold, score: Math.round(best.score * 100) / 100, heard: best.heard };
}
