import { useMemo } from 'react';
import { Image } from 'react-native';

/** 웹은 SVG를 data URI 이미지로 그린다 (마스크까지 브라우저가 정확히 렌더링) */
export function AvatarSvg({ xml, size }: { xml: string; size: number }) {
  const uri = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`, [xml]);
  return <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />;
}
