import Constants from 'expo-constants';

/** GitHub Pages 같은 하위 경로 배포(baseUrl)를 고려한 public 파일 경로 */
export function publicPath(file: string): string {
  const base = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
  return `${base}/${file}`;
}
