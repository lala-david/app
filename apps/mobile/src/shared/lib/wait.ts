/** 애니메이션이 끝나기를 기다릴 때 쓴다 (예: 시트를 닫고 다음 시트를 열 때) */
export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
