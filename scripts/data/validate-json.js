import fs from 'fs';
import path from 'path';
import { validateStream } from '../../frontend/assets/js/validators/validator-core.js';

const dataDir = path.resolve('frontend/assets/data');

fs.readdirSync(dataDir).forEach(file => {
  if (file.endsWith('.json')) {
    const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const valid = validateStream(content);
    console.log(`${file}: ${valid ? '✅ válido' : '❌ inválido'}`);
  }
});
