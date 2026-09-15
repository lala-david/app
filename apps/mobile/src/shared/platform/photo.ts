import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PhotoResult = { ok: true; dataUri: string } | { ok: false; reason: 'denied' | 'canceled' | 'failed' };

/** 갤러리에서 사진을 골라 가운데 정사각형으로 잘라 작은 JPEG data URI로 만든다 */
export async function pickSquarePhoto(size: number, quality: number): Promise<PhotoResult> {
  try {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { ok: false, reason: 'denied' };
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (picked.canceled || !picked.assets?.length) return { ok: false, reason: 'canceled' };

    const { uri, width, height } = picked.assets[0];
    const side = Math.min(width, height);
    const context = ImageManipulator.manipulate(uri);
    context
      .crop({ originX: Math.floor((width - side) / 2), originY: Math.floor((height - side) / 2), width: side, height: side })
      .resize({ width: size, height: size });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
    if (!saved.base64) return { ok: false, reason: 'failed' };
    return { ok: true, dataUri: `data:image/jpeg;base64,${saved.base64}` };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
