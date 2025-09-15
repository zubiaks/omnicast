import fs from 'fs';
import path from 'path';

const backups = [
  'home_backup.json',
  'iptv_backup.json',
  'radio_backup.json',
  'vod_backup.json',
  'webcam_backup.json'
];

const dir = path.resolve('frontend/assets/data');

backups.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    console.log(`Criado backup vazio: ${file}`);
  }
});
