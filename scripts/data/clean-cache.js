import fs from 'fs';
import path from 'path';

const cacheDir = path.resolve('.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('🧹 Cache local removido.');
}
