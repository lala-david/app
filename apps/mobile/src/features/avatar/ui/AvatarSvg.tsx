import { SvgXml } from 'react-native-svg';

export function AvatarSvg({ xml, size }: { xml: string; size: number }) {
  return <SvgXml xml={xml} width={size} height={size} />;
}
