export interface SplashVideoProps {
  muted: boolean;
  /** 화면이 영상(9:16)보다 길쭉하면 contain: 로고와 캐릭터가 잘리지 않게 폭에 맞춘다 */
  fit: 'cover' | 'contain';
}
