import { strings } from '@/shared/i18n/strings.ko';
import type { IconName } from '@/shared/ui/icons';

export interface TabConfig {
  name: 'home' | 'parent' | 'settings';
  label: string;
  icon: IconName;
}

export const TABS: TabConfig[] = [
  { name: 'home', label: strings.tabs.home, icon: 'map' },
  { name: 'parent', label: strings.tabs.parent, icon: 'chart' },
  { name: 'settings', label: strings.tabs.settings, icon: 'gear' },
];
