import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** zustand persist 공용 저장소. 앱은 AsyncStorage, 웹은 localStorage로 동작한다 */
export const persistStorage = createJSONStorage(() => AsyncStorage);

export const STORAGE_PREFIX = 'soundsfun';

export const storageKey = (name: string) => `${STORAGE_PREFIX}:${name}`;
