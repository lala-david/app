/**
 * 브라우저는 사용자가 페이지를 한 번도 누르지 않았으면 소리 재생을 거절한다.
 * 첫 터치·키 입력 전에는 재생을 건너뛰어, 처리되지 않은 오류 없이 조용히 넘어간다.
 */
let unlocked = false;

if (typeof window !== 'undefined') {
  const unlock = () => {
    unlocked = true;
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
