// 알림 오른쪽에 뜨는 큰 그림(캐릭터·아이콘)을 안드로이드 빌드에 넣는다.
//  - assets/notifications/notif_*.png → android/app/src/main/res/drawable-nodpi/
//  - 따로 고르지 않은 알림은 기본 그림(defaultArt)을 쓴다
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_DIR = 'assets/notifications';
const LARGE_ICON_KEY = 'expo.modules.notifications.large_notification_icon';

module.exports = function withNotificationArt(config, { defaultArt = 'notif_bell' } = {}) {
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const from = path.join(cfg.modRequest.projectRoot, SOURCE_DIR);
      const to = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/drawable-nodpi');
      fs.mkdirSync(to, { recursive: true });
      for (const file of fs.readdirSync(from).filter((f) => f.endsWith('.png'))) fs.copyFileSync(path.join(from, file), path.join(to, file));
      return cfg;
    },
  ]);

  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, LARGE_ICON_KEY, `@drawable/${defaultArt}`, 'resource');
    return cfg;
  });
};
