import { useEffect } from 'react';

import { colors } from '@/shared/theme/tokens';
import { publicPath } from '@/shared/platform/publicPath';

const HEAD_TAGS: { tag: 'link' | 'meta'; attrs: Record<string, string> }[] = [
  { tag: 'link', attrs: { rel: 'manifest', href: publicPath('manifest.json') } },
  { tag: 'link', attrs: { rel: 'apple-touch-icon', href: publicPath('icons/pwa-192.png') } },
  { tag: 'meta', attrs: { name: 'theme-color', content: colors.heroTo } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'SoundsFun' } },
];

/** 홈 화면 추가(PWA)에 필요한 head 태그 */
export function usePwaHead(): void {
  useEffect(() => {
    document.documentElement.lang = 'ko';
    HEAD_TAGS.forEach(({ tag, attrs }) => {
      const selector = tag === 'link' ? `link[rel="${attrs.rel}"]` : `meta[name="${attrs.name}"]`;
      if (document.head.querySelector(selector)) return;
      const element = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      document.head.appendChild(element);
    });
  }, []);
}
